export default {
  async fetch(request, env) {
    // CORS headers for all responses
    const cors = {
      'Access-Control-Allow-Origin': 'https://scalenational.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    let body;
    try { body = await request.json(); } catch(e) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const { firstName, lastName, phone, message } = body;
    if (!firstName || !message) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing fields' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const GHL_TOKEN = env.GHL_TOKEN;
    const LOCATION_ID = env.LOCATION_ID;
    const results = {};

    // 1. Create GHL Contact
    let contactId = null;
    try {
      const contactRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_TOKEN}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locationId: LOCATION_ID,
          firstName,
          lastName: lastName || '',
          phone: phone || '',
          tags: ['website-chat'],
          source: 'scalenational.com chat widget'
        })
      });
      const contactData = await contactRes.json();
      contactId = contactData?.contact?.id;
      results.contact = contactId ? 'created' : 'failed';

      // Add note with message
      if (contactId) {
        await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_TOKEN}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ body: `Chat widget message: ${message}` })
        });
      }
    } catch(e) { results.contact = 'error: ' + e.message; }

    // 2. Send SMS to lead (only if they provided a phone number)
    if (phone && phone.length > 6 && contactId) {
      try {
        const smsRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_TOKEN}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'SMS',
            contactId: contactId,
            locationId: LOCATION_ID,
            message: `Hey ${firstName}! Thanks for reaching out to Scale National. We got your message and will be in touch shortly. In the meantime, book a free call here: https://calendar.app.google/XPiWCwELdEtymrVS6`
          })
        });
        const smsData = await smsRes.json();
        results.smsToLead = smsRes.ok ? 'sent' : `failed: ${JSON.stringify(smsData)}`;
      } catch(e) { results.smsToLead = 'error: ' + e.message; }
    }

    // 3. Alert Eric and Tim via GHL workflow triggered by website-chat tag
    results.alert = 'use GHL workflow on website-chat tag for internal alerts';

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};
