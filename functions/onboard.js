/**
 * Cloudflare Pages Function — /onboard
 * POST: Receives multipart/form-data from the client onboarding form,
 *       parses all fields, sends a formatted email via Resend.
 */

const RESEND_KEY   = 're_JknkKC6j_13yygp1KZtRXqxyeqrfMEJGu';
const GHL_TOKEN    = 'pit-0f6cdeea-ddbf-4c1e-bdd7-5b1bd0d919d6';
const GHL_LOCATION = 'bxAx2g1z6Dd09kSdJZYt';
const GHL_BASE     = 'https://services.leadconnectorhq.com';
const GHL_VERSION  = '2021-07-28';

const CORS = {
  'Access-Control-Allow-Origin': 'https://scalenational.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildEmailHtml(fields) {
  const {
    businessName, ownerFirst, ownerLast, phones, emails,
    website, address, services, certifications,
    primaryColor, secondaryColor, brandNotes, staff, notes,
    tradeType, yearsInBusiness, serviceArea, tagline, aboutBusiness,
    licensedInsured, licenseNumber, emergencyServices, hours,
    googleBusinessUrl, facebookUrl, instagramUrl, youtubeUrl,
    photoCount,
  } = fields;

  const phonesArr = JSON.parse(phones || '[]');
  const emailsArr = JSON.parse(emails || '[]');
  const staffArr  = JSON.parse(staff || '[]');

  const sectionStyle = 'style="margin-top:24px;margin-bottom:8px;font-size:12px;font-weight:800;color:#FF5A1F;text-transform:uppercase;letter-spacing:1px;"';
  const tdLabel = 'style="padding:6px 12px;font-weight:bold;vertical-align:top;white-space:nowrap;"';
  const tdValue = 'style="padding:6px 12px;vertical-align:top;"';

  let html = `
    <div style="font-family:sans-serif;font-size:14px;color:#222;max-width:600px;">
      <h2 style="margin-bottom:4px;">New Client Onboarding</h2>
      <p style="color:#666;margin-bottom:20px;">Submitted from scalenational.com/onboarding.html</p>

      <div ${sectionStyle}>Business Info</div>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td ${tdLabel}>Business</td><td ${tdValue}>${esc(businessName)}</td></tr>
        <tr><td ${tdLabel}>Owner</td><td ${tdValue}>${esc(ownerFirst)} ${esc(ownerLast)}</td></tr>
        <tr><td ${tdLabel}>Phone(s)</td><td ${tdValue}>${phonesArr.map(esc).join('<br>') || '—'}</td></tr>
        <tr><td ${tdLabel}>Email(s)</td><td ${tdValue}>${emailsArr.map(esc).join('<br>') || '—'}</td></tr>
        <tr><td ${tdLabel}>Website</td><td ${tdValue}>${website ? esc(website) : '—'}</td></tr>
        <tr><td ${tdLabel}>Address</td><td ${tdValue}>${address ? esc(address) : '—'}</td></tr>
        <tr><td ${tdLabel}>Licensed &amp; Insured</td><td ${tdValue}>${licensedInsured || '—'}${licensedInsured === 'Yes' && licenseNumber ? ` (License #: ${esc(licenseNumber)})` : ''}</td></tr>
        <tr><td ${tdLabel}>Emergency Services</td><td ${tdValue}>${emergencyServices || '—'}</td></tr>
        <tr><td ${tdLabel}>Hours</td><td ${tdValue}>${hours ? esc(hours) : '—'}</td></tr>
      </table>

      <div ${sectionStyle}>Website &amp; Review Info</div>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td ${tdLabel}>Trade Type</td><td ${tdValue}>${esc(tradeType)}</td></tr>
        <tr><td ${tdLabel}>Years in Business</td><td ${tdValue}>${esc(yearsInBusiness)}</td></tr>
        <tr><td ${tdLabel}>Tagline</td><td ${tdValue}>${tagline ? esc(tagline) : '—'}</td></tr>
        <tr><td ${tdLabel}>Google Business URL</td><td ${tdValue}>${googleBusinessUrl ? `<a href="${esc(googleBusinessUrl)}">${esc(googleBusinessUrl)}</a>` : '—'}</td></tr>
        <tr><td ${tdLabel}>Service Area</td><td ${tdValue}>${esc(serviceArea)}</td></tr>
      </table>`;

  if (aboutBusiness) {
    html += `
      <div ${sectionStyle}>About</div>
      <p style="padding:0 12px;white-space:pre-wrap;">${esc(aboutBusiness)}</p>`;
  }

  html += `
      <div ${sectionStyle}>Services</div>
      <p style="padding:0 12px;white-space:pre-wrap;">${esc(services)}</p>

      <div ${sectionStyle}>Associations &amp; Certifications</div>
      <p style="padding:0 12px;white-space:pre-wrap;">${certifications ? esc(certifications) : '—'}</p>

      <div ${sectionStyle}>Brand &amp; Design</div>
      <table style="border-collapse:collapse;width:100%;">
        <tr>
          <td ${tdLabel}>Primary Color</td>
          <td ${tdValue}>
            ${primaryColor ? `<span style="display:inline-block;width:16px;height:16px;background:${esc(primaryColor)};border-radius:3px;vertical-align:middle;margin-right:6px;"></span>${esc(primaryColor)}` : '—'}
          </td>
        </tr>
        <tr>
          <td ${tdLabel}>Secondary Color</td>
          <td ${tdValue}>
            ${secondaryColor ? `<span style="display:inline-block;width:16px;height:16px;background:${esc(secondaryColor)};border-radius:3px;vertical-align:middle;margin-right:6px;"></span>${esc(secondaryColor)}` : '—'}
          </td>
        </tr>
        <tr><td ${tdLabel}>Brand Notes</td><td ${tdValue}>${brandNotes ? esc(brandNotes) : '—'}</td></tr>
        ${facebookUrl ? `<tr><td ${tdLabel}>Facebook</td><td ${tdValue}><a href="${esc(facebookUrl)}">${esc(facebookUrl)}</a></td></tr>` : ''}
        ${instagramUrl ? `<tr><td ${tdLabel}>Instagram</td><td ${tdValue}><a href="${esc(instagramUrl)}">${esc(instagramUrl)}</a></td></tr>` : ''}
        ${youtubeUrl ? `<tr><td ${tdLabel}>YouTube</td><td ${tdValue}><a href="${esc(youtubeUrl)}">${esc(youtubeUrl)}</a></td></tr>` : ''}
      </table>`;

  if (staffArr.length > 0) {
    html += `
      <div ${sectionStyle}>Staff</div>
      <table style="border-collapse:collapse;width:100%;">
        <tr style="background:#f5f5f5;">
          <td ${tdLabel}>First</td><td ${tdLabel}>Last</td><td ${tdLabel}>Role</td>
        </tr>`;
    for (const s of staffArr) {
      html += `<tr><td ${tdValue}>${esc(s.first)}</td><td ${tdValue}>${esc(s.last)}</td><td ${tdValue}>${esc(s.role) || '—'}</td></tr>`;
    }
    html += `</table>`;
  }

  html += `
      <div ${sectionStyle}>Photos / Media</div>
      <p style="padding:0 12px;">${photoCount > 0 ? `${photoCount} file(s) uploaded (attached to this email)` : 'No files uploaded'}</p>`;

  if (notes) {
    html += `
      <div ${sectionStyle}>Additional Notes</div>
      <p style="padding:0 12px;white-space:pre-wrap;">${esc(notes)}</p>`;
  }

  html += `</div>`;
  return html;
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Invalid form data' }, 400);
  }

  // Extract fields
  const businessName  = formData.get('businessName') || '';
  const ownerFirst    = formData.get('ownerFirst') || '';
  const ownerLast     = formData.get('ownerLast') || '';
  const phones        = formData.get('phones') || '[]';
  const emails        = formData.get('emails') || '[]';
  const website       = formData.get('website') || '';
  const address       = formData.get('address') || '';
  const services      = formData.get('services') || '';
  const certifications = formData.get('certifications') || '';
  const primaryColor  = formData.get('primaryColor') || '';
  const secondaryColor = formData.get('secondaryColor') || '';
  const brandNotes    = formData.get('brandNotes') || '';
  const tradeType      = formData.get('tradeType') || '';
  const yearsInBusiness = formData.get('yearsInBusiness') || '';
  const serviceArea    = formData.get('serviceArea') || '';
  const tagline        = formData.get('tagline') || '';
  const aboutBusiness  = formData.get('aboutBusiness') || '';
  const licensedInsured = formData.get('licensedInsured') || '';
  const licenseNumber  = formData.get('licenseNumber') || '';
  const emergencyServices = formData.get('emergencyServices') || '';
  const hours          = formData.get('hours') || '';
  const googleBusinessUrl = formData.get('googleBusinessUrl') || '';
  const facebookUrl    = formData.get('facebookUrl') || '';
  const instagramUrl   = formData.get('instagramUrl') || '';
  const youtubeUrl     = formData.get('youtubeUrl') || '';
  const staff         = formData.get('staff') || '[]';
  const notes         = formData.get('notes') || '';

  // Validate required
  if (!businessName || !ownerFirst || !ownerLast || !services || !tradeType || !yearsInBusiness || !serviceArea || !googleBusinessUrl) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const phonesArr = JSON.parse(phones);
  const emailsArr = JSON.parse(emails);
  if (!phonesArr.length || !emailsArr.length) {
    return json({ error: 'At least one phone number and one email are required' }, 400);
  }

  // Collect uploaded photos
  const photos = formData.getAll('photos').filter(f => f instanceof File && f.size > 0);

  // Build attachments array for Resend (base64 encoded)
  const attachments = [];
  for (const photo of photos) {
    try {
      const buffer = await photo.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      attachments.push({
        filename: photo.name,
        content: base64,
      });
    } catch {
      // Skip files that fail to process
    }
  }

  const fields = {
    businessName, ownerFirst, ownerLast, phones, emails,
    website, address, services, certifications,
    primaryColor, secondaryColor, brandNotes, staff, notes,
    tradeType, yearsInBusiness, serviceArea, tagline, aboutBusiness,
    licensedInsured, licenseNumber, emergencyServices, hours,
    googleBusinessUrl, facebookUrl, instagramUrl, youtubeUrl,
    photoCount: photos.length,
  };

  const emailHtml = buildEmailHtml(fields);

  // Send via Resend
  try {
    const emailPayload = {
      from: 'Scale National <notifications@scalenational.com>',
      to: ['info@scalenational.com'],
      subject: `New Client Onboarding — ${businessName}`,
      html: emailHtml,
    };

    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return json({ ok: false, error: 'Failed to send notification email' }, 502);
    }
  } catch (err) {
    console.error('Resend exception:', err);
    return json({ ok: false, error: 'Failed to send notification email' }, 502);
  }

  // ── GHL: Create contact + note ─────────────────────────────────────
  try {
    const ghlHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GHL_TOKEN}`,
      'Version': GHL_VERSION,
    };

    // 1. Create contact
    const contactPayload = {
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
      customFields: [
        { key: 'business_name', field_value: businessName },
        { key: 'job_type', field_value: tradeType },
        { key: 'google_review_url', field_value: googleBusinessUrl },
      ],
    };

    const contactRes  = await fetch(`${GHL_BASE}/contacts/`, {
      method:  'POST',
      headers: ghlHeaders,
      body:    JSON.stringify(contactPayload),
    });
    const contactData = await contactRes.json();
    const contactId   = contactData?.contact?.id;

    if (contactId) {
      // 2. Add detailed note with all onboarding info
      const staffArr2  = JSON.parse(staff || '[]');
      const staffLines = staffArr2.length
        ? staffArr2.map(s => `  - ${s.first} ${s.last}${s.role ? ` (${s.role})` : ''}`).join('\n')
        : '  None provided';

      const noteBody = [
        `=== CLIENT ONBOARDING SUBMISSION ===`,
        ``,
        `BUSINESS: ${businessName}`,
        `OWNER: ${ownerFirst} ${ownerLast}`,
        `TRADE TYPE: ${tradeType}`,
        `YEARS IN BUSINESS: ${yearsInBusiness}`,
        `PHONES: ${phonesArr.join(', ')}`,
        `EMAILS: ${emailsArr.join(', ')}`,
        website    ? `WEBSITE: ${website}` : null,
        address    ? `ADDRESS: ${address}` : null,
        `SERVICE AREA: ${serviceArea}`,
        tagline    ? `TAGLINE: ${tagline}` : null,
        `GOOGLE BUSINESS URL: ${googleBusinessUrl}`,
        licensedInsured ? `LICENSED & INSURED: ${licensedInsured}${licensedInsured === 'Yes' && licenseNumber ? ` (License #: ${licenseNumber})` : ''}` : null,
        emergencyServices ? `EMERGENCY SERVICES: ${emergencyServices}` : null,
        hours      ? `HOURS: ${hours}` : null,
        ``,
        aboutBusiness ? `ABOUT:\n${aboutBusiness}\n` : null,
        `SERVICES OFFERED:`,
        services,
        ``,
        `ASSOCIATIONS / CERTIFICATIONS:`,
        certifications || 'None provided',
        ``,
        `BRAND COLORS:`,
        `  Primary: ${primaryColor || 'Not specified'}`,
        `  Secondary: ${secondaryColor || 'Not specified'}`,
        brandNotes ? `  Notes: ${brandNotes}` : null,
        facebookUrl  ? `FACEBOOK: ${facebookUrl}` : null,
        instagramUrl ? `INSTAGRAM: ${instagramUrl}` : null,
        youtubeUrl   ? `YOUTUBE: ${youtubeUrl}` : null,
        ``,
        `STAFF:`,
        staffLines,
        notes ? `\nADDITIONAL NOTES:\n${notes}` : null,
        ``,
        `PHOTOS UPLOADED: ${photos.length}`,
      ].filter(l => l !== null).join('\n');

      await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
        method:  'POST',
        headers: ghlHeaders,
        body:    JSON.stringify({ body: noteBody, userId: contactId }),
      });

      // 3. Create opportunity in pipeline
      await fetch(`${GHL_BASE}/opportunities/`, {
        method:  'POST',
        headers: ghlHeaders,
        body:    JSON.stringify({
          locationId:  GHL_LOCATION,
          contactId,
          name:        `${businessName} — Onboarding`,
          pipelineId:  '4Rn80qQGJ89k8ycfTPNX',
          stageId:     'e3decf39-4c42-4137-8fd4-7ecd3143c5a4',
          status:      'open',
        }),
      });
    }
  } catch (err) {
    console.error('GHL error:', err);
    // Don't fail the request if GHL is down — email already sent
  }

  return json({ ok: true });
}
