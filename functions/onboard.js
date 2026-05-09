/**
 * Cloudflare Pages Function — /onboard
 * POST: Receives multipart/form-data from the client onboarding form.
 *
 * Flow:
 *   1. Search GHL for existing contact by email, then phone.
 *   2. If found → use existing contact. If not → create new contact.
 *   3. Search for existing opportunity in Client Onboarding pipeline.
 *   4. If found in "Signed" stage → move it to "Onboarding Form Received".
 *   5. If not found → create new opportunity in "Onboarding Form Received".
 *   6. Add short note to contact.
 *   7. Send detailed internal email with attachments via Resend.
 *   8. Fire thank-you email to client via GHL.
 */

const GHL_TOKEN    = 'pit-0f6cdeea-ddbf-4c1e-bdd7-5b1bd0d919d6';
const GHL_LOCATION = 'bxAx2g1z6Dd09kSdJZYt';
const GHL_BASE     = 'https://services.leadconnectorhq.com';
const GHL_VERSION  = '2021-07-28';

const PIPELINE_ID        = 'cj4PcpkZVtjn3oW2PdYS';
const STAGE_SIGNED       = 'ba9712f4-57bd-46c9-9a87-82859f01c8fd';
const STAGE_FORM_RECEIVED = 'ff0ae1b2-1344-45c1-8742-51e821483eba';

const RESEND_API_KEY  = 're_JknkKC6j_13yygp1KZtRXqxyeqrfMEJGu';
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST')    return json({ error: 'Method not allowed' }, 405);

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Invalid form data' }, 400);
  }

  // ── Extract fields ──────────────────────────────────────────────────
  const businessName     = formData.get('businessName')     || '';
  const ownerFirst       = formData.get('ownerFirst')       || '';
  const ownerLast        = formData.get('ownerLast')        || '';
  const phones           = formData.get('phones')           || '[]';
  const emails           = formData.get('emails')           || '[]';
  const website          = formData.get('website')          || '';
  const address          = formData.get('address')          || '';
  const services         = formData.get('services')         || '';
  const certifications   = formData.get('certifications')   || '';
  const primaryColor     = formData.get('primaryColor')     || '';
  const secondaryColor   = formData.get('secondaryColor')   || '';
  const brandNotes       = formData.get('brandNotes')       || '';
  const tradeType        = formData.get('tradeType')        || '';
  const yearsInBusiness  = formData.get('yearsInBusiness')  || '';
  const serviceArea      = formData.get('serviceArea')      || '';
  const tagline          = formData.get('tagline')          || '';
  const aboutBusiness    = formData.get('aboutBusiness')    || '';
  const licensedInsured  = formData.get('licensedInsured')  || '';
  const licenseNumber    = formData.get('licenseNumber')    || '';
  const emergencyServices = formData.get('emergencyServices') || '';
  const hours            = formData.get('hours')            || '';
  const googleBusinessUrl = formData.get('googleBusinessUrl') || '';
  const facebookUrl      = formData.get('facebookUrl')      || '';
  const instagramUrl     = formData.get('instagramUrl')     || '';
  const youtubeUrl       = formData.get('youtubeUrl')       || '';
  const staff            = formData.get('staff')            || '[]';
  const notes            = formData.get('notes')            || '';

  if (!businessName) return json({ error: 'Business name is required' }, 400);

  let phonesArr, emailsArr;
  try {
    phonesArr = JSON.parse(phones);
    emailsArr = JSON.parse(emails);
  } catch {
    return json({ error: 'Invalid phone or email data' }, 400);
  }

  const photos = formData.getAll('photos').filter(f => f instanceof File && f.size > 0);

  // ── GHL ────────────────────────────────────────────────────────────
  try {
    const ghlHeaders = {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GHL_TOKEN}`,
      'Version':       GHL_VERSION,
    };

    // ── 1. Find or create contact ───────────────────────────────────
    let contactId = null;

    // Search by email first, then phone
    for (const query of [emailsArr[0], phonesArr[0]].filter(Boolean)) {
      const searchRes  = await fetch(
        `${GHL_BASE}/contacts/?locationId=${GHL_LOCATION}&query=${encodeURIComponent(query)}`,
        { headers: ghlHeaders }
      );
      const searchData = await searchRes.json();
      const match      = searchData?.contacts?.[0];
      if (match?.id) { contactId = match.id; break; }
    }

    if (!contactId) {
      // No existing contact — create one
      const createRes  = await fetch(`${GHL_BASE}/contacts/`, {
        method:  'POST',
        headers: ghlHeaders,
        body:    JSON.stringify({
          locationId:  GHL_LOCATION,
          firstName:   ownerFirst,
          lastName:    ownerLast,
          email:       emailsArr[0] || '',
          phone:       phonesArr[0] || '',
          companyName: businessName,
          website:     website || '',
          address1:    address || '',
          tags:        ['client-onboarding', 'onboarding-submitted'],
          source:      'onboarding-form',
        }),
      });
      const createData = await createRes.json();
      contactId = createData?.contact?.id || createData?.meta?.contactId;
    }

    if (!contactId) {
      console.error('GHL: could not find or create contact');
      return json({ error: 'Failed to resolve contact in CRM' }, 422);
    }

    // Update contact with business info + custom fields
    await fetch(`${GHL_BASE}/contacts/${contactId}`, {
      method:  'PUT',
      headers: ghlHeaders,
      body:    JSON.stringify({
        firstName:   ownerFirst,
        lastName:    ownerLast,
        email:       emailsArr[0] || '',
        phone:       phonesArr[0] || '',
        companyName: businessName,
        website:     website || '',
        address1:    address || '',
        tags:        ['client-onboarding', 'onboarding-submitted'],
        customFields: [
          { id: 'ycFGBIcsGnxwhOW5YAt8', field_value: businessName },
          { id: 'nMLwyym5kB1IDELNCQ0x', field_value: tradeType },
          { id: 'I5t03jB0XvhoJQ2p8gRn', field_value: googleBusinessUrl },
          { id: 'iwiYHa8Jw1SeKMTTuuJB', field_value: emailsArr[0] || '' },
          { id: 'IoXwmFhoqu6rFG1FbLhE', field_value: phonesArr[0] || '' },
          { id: 'WRUy6o8wTIC1y2xFY8CV', field_value: services },
          { id: 'bmOobbW3wvCh0GPAx0uh', field_value: certifications },
          { id: 'OyPducTd33ZsiKuMDtHM', field_value: primaryColor },
        ],
      }),
    });

    // ── 2. Find or create opportunity ──────────────────────────────
    let opportunityId  = null;
    let existingStage  = null;

    const oppSearch = await fetch(
      `${GHL_BASE}/opportunities/search?location_id=${GHL_LOCATION}&contact_id=${contactId}&pipeline_id=${PIPELINE_ID}`,
      { headers: ghlHeaders }
    );
    const oppData = await oppSearch.json();
    const existingOpp = oppData?.opportunities?.[0];

    if (existingOpp?.id) {
      opportunityId = existingOpp.id;
      existingStage = existingOpp.pipelineStageId;
    }

    if (opportunityId) {
      // Existing opportunity — move to "Onboarding Form Received" if still in "Signed"
      const newStage = existingStage === STAGE_SIGNED ? STAGE_FORM_RECEIVED : existingStage;
      await fetch(`${GHL_BASE}/opportunities/${opportunityId}`, {
        method:  'PUT',
        headers: ghlHeaders,
        body:    JSON.stringify({
          name:            `${businessName} — Onboarding`,
          pipelineStageId: newStage,
          status:          'open',
        }),
      });
    } else {
      // No existing opportunity — create in "Onboarding Form Received"
      await fetch(`${GHL_BASE}/opportunities/`, {
        method:  'POST',
        headers: ghlHeaders,
        body:    JSON.stringify({
          locationId:      GHL_LOCATION,
          contactId,
          name:            `${businessName} — Onboarding`,
          pipelineId:      PIPELINE_ID,
          pipelineStageId: STAGE_FORM_RECEIVED,
          status:          'open',
        }),
      });
    }

    // ── 3. Add short note to contact ──────────────────────────────
    await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
      method:  'POST',
      headers: ghlHeaders,
      body:    JSON.stringify({ body: 'Onboarding form submitted. Full details sent to team email.' }),
    });

    // ── 4. Send detailed internal email via Resend ────────────────
    const staffArr = JSON.parse(staff || '[]');
    const staffRows = staffArr.length
      ? staffArr.map(s => `<li>${escapeHtml(s.first)} ${escapeHtml(s.last)}${s.role ? ` <em>(${escapeHtml(s.role)})</em>` : ''}</li>`).join('')
      : '<li>None provided</li>';

    const colorSwatch = (label, hex) => {
      if (!hex) return `<strong>${escapeHtml(label)}:</strong> Not specified`;
      return `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(hex)} <span style="display:inline-block;width:14px;height:14px;background:${escapeHtml(hex)};border:1px solid #ccc;border-radius:3px;vertical-align:middle;"></span>`;
    };

    const row = (label, value) => {
      if (!value) return '';
      return `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top;white-space:nowrap;color:#333;">${escapeHtml(label)}</td><td style="padding:6px 12px;color:#555;">${escapeHtml(value)}</td></tr>`;
    };

    const linkRow = (label, url) => {
      if (!url) return '';
      return `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top;white-space:nowrap;color:#333;">${escapeHtml(label)}</td><td style="padding:6px 12px;"><a href="${escapeHtml(url)}" style="color:#FF5A1F;">${escapeHtml(url)}</a></td></tr>`;
    };

    const emailHtml = `
      <div style="font-family:'Inter',Helvetica,Arial,sans-serif;max-width:700px;margin:0 auto;">
        <div style="background:#FF5A1F;padding:24px 32px;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;font-size:22px;color:#fff;">New Onboarding Submission</h1>
          <p style="margin:6px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">${escapeHtml(businessName)}</p>
        </div>
        <div style="background:#ffffff;padding:24px 32px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">

          <h2 style="font-size:16px;color:#FF5A1F;margin:24px 0 8px;border-bottom:1px solid #eee;padding-bottom:6px;">Business Info</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${row('Business Name', businessName)}
            ${row('Owner', `${ownerFirst} ${ownerLast}`)}
            ${row('Trade Type', tradeType)}
            ${row('Years in Business', yearsInBusiness)}
            ${row('Phone(s)', phonesArr.join(', '))}
            ${row('Email(s)', emailsArr.join(', '))}
            ${linkRow('Website', website)}
            ${row('Address', address)}
            ${row('Service Area', serviceArea)}
          </table>

          <h2 style="font-size:16px;color:#FF5A1F;margin:24px 0 8px;border-bottom:1px solid #eee;padding-bottom:6px;">Business Details</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${row('Tagline', tagline)}
            ${row('Licensed & Insured', licensedInsured + (licensedInsured === 'Yes' && licenseNumber ? ` (License #: ${licenseNumber})` : ''))}
            ${row('Emergency Services', emergencyServices)}
            ${row('Hours', hours)}
          </table>
          ${aboutBusiness ? `<p style="font-size:14px;margin:12px 0 4px;"><strong>About the Business:</strong></p><p style="font-size:14px;color:#555;white-space:pre-wrap;">${escapeHtml(aboutBusiness)}</p>` : ''}
          ${services ? `<p style="font-size:14px;margin:12px 0 4px;"><strong>Services Offered:</strong></p><p style="font-size:14px;color:#555;white-space:pre-wrap;">${escapeHtml(services)}</p>` : ''}
          ${certifications ? `<p style="font-size:14px;margin:12px 0 4px;"><strong>Certifications / Associations:</strong></p><p style="font-size:14px;color:#555;">${escapeHtml(certifications)}</p>` : ''}

          <h2 style="font-size:16px;color:#FF5A1F;margin:24px 0 8px;border-bottom:1px solid #eee;padding-bottom:6px;">Online Presence</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${linkRow('Google Business', googleBusinessUrl)}
            ${linkRow('Facebook', facebookUrl)}
            ${linkRow('Instagram', instagramUrl)}
            ${linkRow('YouTube', youtubeUrl)}
          </table>

          <h2 style="font-size:16px;color:#FF5A1F;margin:24px 0 8px;border-bottom:1px solid #eee;padding-bottom:6px;">Team</h2>
          <ul style="font-size:14px;color:#555;margin:0;padding-left:20px;">${staffRows}</ul>

          <h2 style="font-size:16px;color:#FF5A1F;margin:24px 0 8px;border-bottom:1px solid #eee;padding-bottom:6px;">Brand</h2>
          <p style="font-size:14px;margin:4px 0;">${colorSwatch('Primary Color', primaryColor)}</p>
          <p style="font-size:14px;margin:4px 0;">${colorSwatch('Secondary Color', secondaryColor)}</p>
          ${brandNotes ? `<p style="font-size:14px;margin:8px 0 0;"><strong>Brand Notes:</strong> ${escapeHtml(brandNotes)}</p>` : ''}

          ${notes ? `<h2 style="font-size:16px;color:#FF5A1F;margin:24px 0 8px;border-bottom:1px solid #eee;padding-bottom:6px;">Additional Notes</h2><p style="font-size:14px;color:#555;white-space:pre-wrap;">${escapeHtml(notes)}</p>` : ''}

          <p style="font-size:13px;color:#999;margin:24px 0 0;border-top:1px solid #eee;padding-top:12px;">
            ${photos.length} photo(s) attached below.
          </p>
        </div>
      </div>
    `;

    // Build attachments from uploaded photos
    const attachments = [];
    for (const photo of photos) {
      const base64 = await fileToBase64(photo);
      attachments.push({
        filename: photo.name || 'photo.jpg',
        content:  base64,
      });
    }

    const resendPayload = {
      from:    'Scale National <onboarding@scalenational.com>',
      to:      ['eric@scalenational.com'],
      cc:      ['tima@scalenational.com'],
      subject: `New Onboarding Submission — ${businessName}`,
      html:    emailHtml,
    };

    if (attachments.length > 0) {
      resendPayload.attachments = attachments;
    }

    const resendRes = await fetch(RESEND_ENDPOINT, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendPayload),
    });

    if (!resendRes.ok) {
      console.error('Resend error:', resendRes.status, await resendRes.text());
    }

    // ── 5. Thank-you email to client ───────────────────────────────
    if (emailsArr[0]) {
      const firstName = ownerFirst || businessName;
      await fetch(`${GHL_BASE}/conversations/messages/outbound`, {
        method:  'POST',
        headers: ghlHeaders,
        body:    JSON.stringify({
          type:      'Email',
          contactId,
          emailFrom: 'Scale National <info@scalenational.com>',
          emailTo:   emailsArr[0],
          subject:   `We received your onboarding info, ${firstName}!`,
          html: `
            <div style="font-family:'Inter',sans-serif;max-width:560px;margin:0 auto;background:#0d0d0d;color:#ffffff;border-radius:12px;overflow:hidden;">
              <div style="background:#FF5A1F;padding:32px 40px;">
                <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">You're all set, ${firstName}!</h1>
              </div>
              <div style="padding:32px 40px;">
                <p style="font-size:16px;line-height:1.6;color:#cccccc;margin:0 0 16px;">
                  We've received everything for <strong style="color:#fff;">${businessName}</strong> and our team is already on it.
                </p>
                <p style="font-size:16px;line-height:1.6;color:#cccccc;margin:0 0 16px;">Here's what happens next:</p>
                <ol style="color:#cccccc;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
                  <li>We review your submission and begin building your system</li>
                  <li>Your website goes live within 24–48 hours</li>
                  <li>Review automation and missed call text-back activate within 1–2 weeks (carrier processing)</li>
                  <li>We'll reach out if we need anything else from you</li>
                </ol>
                <p style="font-size:15px;color:#999999;margin:0 0 24px;">
                  Questions? Reply to this email or text us directly — we'll get back to you fast.
                </p>
                <a href="https://scalenational.com" style="display:inline-block;background:#FF5A1F;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Visit Scale National</a>
              </div>
              <div style="padding:20px 40px;border-top:1px solid #1f1f1f;">
                <p style="font-size:12px;color:#555555;margin:0;">Scale National · Contractor Marketing · scalenational.com</p>
              </div>
            </div>
          `,
        }),
      });
    }

  } catch (err) {
    console.error('GHL error:', err?.message || err);
    return json({ error: 'Internal error processing onboarding' }, 422);
  }

  return json({ ok: true });
}
