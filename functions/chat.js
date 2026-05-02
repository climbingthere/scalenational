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

    // Add note
    if (contactId) {
      await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GHL_TOKEN}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: `Chat: ${message}` })
      });
    }
  } catch(e) {}

  // 2. SMS to lead
  if (phone && phone.length > 6 && contactId) {
    try {
      await fetch('https://services.leadconnectorhq.com/conversations/messages', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GHL_TOKEN}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SMS',
          contactId,
          locationId: LOCATION_ID,
          message: `Hey ${firstName}! Thanks for reaching out to Scale National. We got your message and will be in touch shortly. Book a free call: https://calendar.app.google/XPiWCwELdEtymrVS6`
        })
      });
    } catch(e) {}
  }

  return new Response(JSON.stringify({ ok: true }), { headers: cors });
}

export async function onRequestOptions() {
  return new Response(null, { headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }});
}
