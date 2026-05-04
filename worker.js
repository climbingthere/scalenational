export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': 'https://scalenational.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    const jsonHeaders = { ...cors, 'Content-Type': 'application/json' };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ── Route: /intake ──
    if (path === '/intake') {
      return handleIntake(request, env, cors, jsonHeaders);
    }

    // ── Route: /onboard ──
    if (path === '/onboard') {
      return handleOnboard(request, env, cors, jsonHeaders);
    }

    // ── Route: /chat* (default — existing logic) ──
    if (path.startsWith('/chat')) {
      return handleChat(request, env, cors, jsonHeaders);
    }

    return new Response(JSON.stringify({ ok: false, error: 'Not found' }), { status: 404, headers: jsonHeaders });
  }
};

// ─────────────────────────────────────────────
// GHL helpers
// ─────────────────────────────────────────────

function ghlHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json',
  };
}

async function createGHLContact(env, data) {
  const res = await fetch('https://services.leadconnectorhq.com/contacts/', {
    method: 'POST',
    headers: ghlHeaders(env.GHL_TOKEN),
    body: JSON.stringify({ locationId: env.LOCATION_ID, ...data }),
  });
  const json = await res.json();
  return json?.contact?.id || null;
}

async function addGHLNote(env, contactId, body) {
  await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
    method: 'POST',
    headers: ghlHeaders(env.GHL_TOKEN),
    body: JSON.stringify({ body }),
  });
}

async function createGHLOpportunity(env, { contactId, name }) {
  await fetch('https://services.leadconnectorhq.com/opportunities/', {
    method: 'POST',
    headers: ghlHeaders(env.GHL_TOKEN),
    body: JSON.stringify({
      pipelineId: 'VxsnPyFkv6rjjHDA30M7',
      stageId: 'a3e90324-df2f-4593-9d74-160b2d9c5f81',
      locationId: env.LOCATION_ID,
      contactId,
      name,
      status: 'open',
    }),
  });
}

async function sendResendEmail(env, { subject, html }) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Scale National <notifications@scalenational.com>',
      to: ['eric@scalenational.com'],
      subject,
      html,
    }),
  });
}

// ─────────────────────────────────────────────
// /intake handler
// ─────────────────────────────────────────────

async function handleIntake(request, env, cors, jsonHeaders) {
  let body;
  try { body = await request.json(); } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: jsonHeaders });
  }

  const { firstName, lastName, businessName, email, phone, trade, revenue, reviewCount, reviewRating } = body;

  if (!firstName || !lastName || !businessName || !email || !phone || !trade) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400, headers: jsonHeaders });
  }

  try {
    // 1. Create GHL contact
    const contactId = await createGHLContact(env, {
      firstName,
      lastName,
      email,
      phone,
      companyName: businessName,
      tags: ['new-lead', 'website-intake'],
      source: 'website-intake',
    });

    // 2. Create opportunity
    if (contactId) {
      await createGHLOpportunity(env, {
        contactId,
        name: `${businessName} — New Lead`,
      });
    }

    // 3. Send notification email
    const emailHtml = `
      <h2>New Lead — ${esc(businessName)}</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name</td><td>${esc(firstName)} ${esc(lastName)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Business</td><td>${esc(businessName)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email</td><td>${esc(email)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone</td><td>${esc(phone)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Trade</td><td>${esc(trade)}</td></tr>
        ${revenue ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Revenue</td><td>${esc(revenue)}</td></tr>` : ''}
        ${reviewCount ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Reviews</td><td>${esc(String(reviewCount))}</td></tr>` : ''}
        ${reviewRating ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Rating</td><td>${esc(reviewRating)}</td></tr>` : ''}
      </table>
    `;

    await sendResendEmail(env, {
      subject: `New Lead — ${businessName}`,
      html: emailHtml,
    });

    return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: jsonHeaders });
  }
}

// ─────────────────────────────────────────────
// /onboard handler
// ─────────────────────────────────────────────

async function handleOnboard(request, env, cors, jsonHeaders) {
  let fd;
  try { fd = await request.formData(); } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid form data' }), { status: 400, headers: jsonHeaders });
  }

  const businessName = fd.get('businessName') || '';
  const ownerFirst = fd.get('ownerFirst') || '';
  const ownerLast = fd.get('ownerLast') || '';
  const website = fd.get('website') || '';
  const address = fd.get('address') || '';
  const services = fd.get('services') || '';
  const certifications = fd.get('certifications') || '';
  const primaryColor = fd.get('primaryColor') || '';
  const secondaryColor = fd.get('secondaryColor') || '';
  const brandNotes = fd.get('brandNotes') || '';
  const notes = fd.get('notes') || '';

  let phonesArr = [];
  let emailsArr = [];
  let staffArr = [];

  try { phonesArr = JSON.parse(fd.get('phones') || '[]'); } catch (e) { /* ignore */ }
  try { emailsArr = JSON.parse(fd.get('emails') || '[]'); } catch (e) { /* ignore */ }
  try { staffArr = JSON.parse(fd.get('staff') || '[]'); } catch (e) { /* ignore */ }

  // Count uploaded photos
  const photos = fd.getAll('photos').filter(f => f instanceof File && f.size > 0);
  const photoCount = photos.length;

  if (!businessName || !ownerFirst || !ownerLast || !services || phonesArr.length === 0 || emailsArr.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), { status: 400, headers: jsonHeaders });
  }

  try {
    // 1. Create GHL contact
    const contactId = await createGHLContact(env, {
      firstName: ownerFirst,
      lastName: ownerLast,
      email: emailsArr[0],
      phone: phonesArr[0],
      companyName: businessName,
      tags: ['client-onboarding'],
      source: 'onboarding-form',
    });

    // 2. Add detailed note
    if (contactId) {
      const staffText = staffArr.length > 0
        ? staffArr.map(s => `  - ${s.first} ${s.last} (${s.role})`).join('\n')
        : '  None provided';

      const noteBody = [
        `=== CLIENT ONBOARDING ===`,
        `Business: ${businessName}`,
        `Owner: ${ownerFirst} ${ownerLast}`,
        `Phones: ${phonesArr.join(', ')}`,
        `Emails: ${emailsArr.join(', ')}`,
        `Website: ${website || 'N/A'}`,
        `Address: ${address || 'N/A'}`,
        ``,
        `Services: ${services}`,
        `Certifications: ${certifications || 'N/A'}`,
        ``,
        `Primary Color: ${primaryColor || 'N/A'}`,
        `Secondary Color: ${secondaryColor || 'N/A'}`,
        `Brand Notes: ${brandNotes || 'N/A'}`,
        ``,
        `Staff:\n${staffText}`,
        ``,
        `Additional Notes: ${notes || 'N/A'}`,
        `Photos Uploaded: ${photoCount}`,
      ].join('\n');

      await addGHLNote(env, contactId, noteBody);

      // 3. Create opportunity
      await createGHLOpportunity(env, {
        contactId,
        name: `${businessName} — Onboarding`,
      });
    }

    // 4. Send notification email
    const staffHtml = staffArr.length > 0
      ? staffArr.map(s => `<li>${esc(s.first)} ${esc(s.last)} — ${esc(s.role)}</li>`).join('')
      : '<li>None provided</li>';

    const emailHtml = `
      <h2>New Client Onboarding — ${esc(businessName)}</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Owner</td><td>${esc(ownerFirst)} ${esc(ownerLast)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phones</td><td>${esc(phonesArr.join(', '))}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Emails</td><td>${esc(emailsArr.join(', '))}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Website</td><td>${esc(website || 'N/A')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Address</td><td>${esc(address || 'N/A')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Services</td><td>${esc(services)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Certifications</td><td>${esc(certifications || 'N/A')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Primary Color</td><td>${esc(primaryColor || 'N/A')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Secondary Color</td><td>${esc(secondaryColor || 'N/A')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Brand Notes</td><td>${esc(brandNotes || 'N/A')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Additional Notes</td><td>${esc(notes || 'N/A')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Photos</td><td>${photoCount} photo(s) uploaded</td></tr>
      </table>
      <h3 style="margin-top:16px;">Staff</h3>
      <ul>${staffHtml}</ul>
    `;

    await sendResendEmail(env, {
      subject: `New Client Onboarding — ${businessName}`,
      html: emailHtml,
    });

    return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: jsonHeaders });
  }
}

// ─────────────────────────────────────────────
// /chat* handler (original logic)
// ─────────────────────────────────────────────

async function handleChat(request, env, cors, jsonHeaders) {
  let body;
  try { body = await request.json(); } catch(e) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers: jsonHeaders });
  }

  const { firstName, lastName, phone, message } = body;
  if (!firstName || !message) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing fields' }), { status: 400, headers: jsonHeaders });
  }

  const GHL_TOKEN = env.GHL_TOKEN;
  const LOCATION_ID = env.LOCATION_ID;
  const results = {};

  // 1. Create GHL Contact
  let contactId = null;
  try {
    const contactRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: ghlHeaders(GHL_TOKEN),
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
      await addGHLNote(env, contactId, `Chat widget message: ${message}`);
    }
  } catch(e) { results.contact = 'error: ' + e.message; }

  // 2. Send SMS to lead (only if they provided a phone number)
  if (phone && phone.length > 6 && contactId) {
    try {
      const smsRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
        method: 'POST',
        headers: ghlHeaders(GHL_TOKEN),
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
    headers: jsonHeaders
  });
}

// ─────────────────────────────────────────────
// Utility: HTML-escape
// ─────────────────────────────────────────────

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
