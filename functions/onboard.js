/**
 * Cloudflare Pages Function — /onboard
 * POST: Receives multipart/form-data from the client onboarding form,
 *       creates a GHL contact, note, and opportunity.
 */

const GHL_TOKEN    = 'pit-0f6cdeea-ddbf-4c1e-bdd7-5b1bd0d919d6';
const GHL_LOCATION = 'bxAx2g1z6Dd09kSdJZYt';
const GHL_BASE     = 'https://services.leadconnectorhq.com';
const GHL_VERSION  = '2021-07-28';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
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

  // Validate required — business name only
  if (!businessName) {
    return json({ error: 'Business name is required' }, 400);
  }

  let phonesArr, emailsArr;
  try {
    phonesArr = JSON.parse(phones);
    emailsArr = JSON.parse(emails);
  } catch {
    return json({ error: 'Invalid phone or email data' }, 400);
  }

  // Phone and email are optional — form may not collect them for all clients

  // Count uploaded photos (for the GHL note)
  const photos = formData.getAll('photos').filter(f => f instanceof File && f.size > 0);

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
        { id: 'ycFGBIcsGnxwhOW5YAt8', field_value: businessName },        // Business Name
        { id: 'nMLwyym5kB1IDELNCQ0x', field_value: tradeType },            // Job Type
        { id: 'I5t03jB0XvhoJQ2p8gRn', field_value: googleBusinessUrl },   // Google Review URL
        { id: 'iwiYHa8Jw1SeKMTTuuJB', field_value: emailsArr[0] || '' },  // Business Email
        { id: 'IoXwmFhoqu6rFG1FbLhE', field_value: phonesArr[0] || '' },  // Business Phone Number
        { id: 'WRUy6o8wTIC1y2xFY8CV', field_value: services },            // Offered Services
        { id: 'bmOobbW3wvCh0GPAx0uh', field_value: certifications },      // Associations/Certifications
        { id: 'OyPducTd33ZsiKuMDtHM', field_value: primaryColor },        // Brand Color
      ],
    };

    const contactRes  = await fetch(`${GHL_BASE}/contacts/`, {
      method:  'POST',
      headers: ghlHeaders,
      body:    JSON.stringify(contactPayload),
    });
    const contactData = await contactRes.json();
    const contactId   = contactData?.contact?.id;

    if (!contactId) {
      console.error('GHL contact creation failed:', JSON.stringify(contactData));
      return json({ error: 'Failed to create contact in CRM' }, 502);
    }

    {
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
      const oppRes = await fetch(`${GHL_BASE}/opportunities/`, {
        method:  'POST',
        headers: ghlHeaders,
        body:    JSON.stringify({
          locationId:      GHL_LOCATION,
          contactId,
          name:            `${businessName} — Onboarding`,
          pipelineId:      'cj4PcpkZVtjn3oW2PdYS',
          pipelineStageId: 'ff0ae1b2-1344-45c1-8742-51e821483eba',
          status:          'open',
        }),
      });

      if (!oppRes.ok) {
        const oppErr = await oppRes.text();
        console.error('GHL opportunity creation failed:', oppRes.status, oppErr);
      }

      // 4. Send thank-you email to client (only if email was provided)
      if (emailsArr[0]) {
        const firstName = ownerFirst || businessName;
        await fetch(`${GHL_BASE}/conversations/messages/outbound`, {
          method:  'POST',
          headers: ghlHeaders,
          body:    JSON.stringify({
            type:          'Email',
            contactId,
            emailFrom:     'Scale National <info@scalenational.com>',
            emailTo:       emailsArr[0],
            subject:       `We received your onboarding info, ${firstName}!`,
            html: `
              <div style="font-family:'Inter',sans-serif;max-width:560px;margin:0 auto;background:#0d0d0d;color:#ffffff;border-radius:12px;overflow:hidden;">
                <div style="background:#FF5A1F;padding:32px 40px;">
                  <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">You're all set, ${firstName}!</h1>
                </div>
                <div style="padding:32px 40px;">
                  <p style="font-size:16px;line-height:1.6;color:#cccccc;margin:0 0 16px;">
                    We've received everything for <strong style="color:#fff;">${businessName}</strong> and our team is already on it.
                  </p>
                  <p style="font-size:16px;line-height:1.6;color:#cccccc;margin:0 0 16px;">
                    Here's what happens next:
                  </p>
                  <ol style="color:#cccccc;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
                    <li>We review your submission and begin building your system</li>
                    <li>Your website goes live within 24–48 hours</li>
                    <li>Review automation and missed call text-back are activated within 1–2 weeks (carrier processing)</li>
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
    }
  } catch (err) {
    console.error('GHL error:', err?.message || err);
    return json({ error: 'Internal error processing onboarding' }, 500);
  }

  return json({ ok: true });
}
