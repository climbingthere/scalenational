export async function onRequestPost({ request, env }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  let body;
  try { body = await request.json(); } catch(e) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: cors });
  }

  const { firstName, lastName, phone, message } = body;
  const GHL_TOKEN = 'pit-78da4d2d-b177-4112-ad8c-15a2a9ac8c36';
  const LOCATION_ID = 'bxAx2g1z6Dd09kSdJZYt';
  const RESEND_KEY = 're_JknkKC6j_13yygp1KZtRXqxyeqrfMEJGu';

  // 1. Create GHL contact
  let contactId = null;
  try {
    const res = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GHL_TOKEN}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId: LOCATION_ID, firstName, lastName: lastName || '', phone: phone || '', tags: ['website-chat'], source: 'scalenational.com chat' })
    });
    const data = await res.json();
    contactId = data?.contact?.id;

    if (contactId) {
      await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GHL_TOKEN}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: `Chat message: ${message}` })
      });
    }
  } catch(e) {}

  // 2. Email alert to Eric & Tim via Resend
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Scale National <eric@scalenational.com>',
        to: ['ekirtchakov@gmail.com', 'tim@scalenational.com'],
        subject: `New chat lead: ${firstName} ${lastName || ''}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;padding:24px;background:#0d0d0d;color:#fff;border-radius:12px;">
            <h2 style="color:#FF5A1F;margin:0 0 16px;">New Lead from scalenational.com</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName || ''}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Message:</strong> ${message}</p>
            ${contactId ? `<p><strong>GHL Contact:</strong> <a href="https://app.gohighlevel.com/contacts/${contactId}" style="color:#FF5A1F;">View in GHL</a></p>` : ''}
            <a href="https://calendar.app.google/XPiWCwELdEtymrVS6" style="display:inline-block;margin-top:16px;background:#FF5A1F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Book a Call With Them</a>
          </div>
        `
      })
    });
  } catch(e) {}

  return new Response(JSON.stringify({ ok: true }), { headers: cors });
}

export async function onRequestOptions() {
  return new Response(null, { headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }});
}
