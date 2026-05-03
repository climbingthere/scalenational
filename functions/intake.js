/**
 * Cloudflare Pages Function — /intake
 * POST: Creates a GHL contact + opportunity in Marketing Pipeline,
 *       sends email alert via Resend, returns contactId & opportunityId.
 */

const GHL_TOKEN  = 'pit-99d7b12e-693a-4577-b431-32fbbaf40ac1';
const GHL_BASE   = 'https://services.leadconnectorhq.com';
const GHL_VER    = '2021-07-28';
const LOCATION   = 'bxAx2g1z6Dd09kSdJZYt';
const PIPELINE   = 'VxsnPyFkv6rjjHDA30M7';
const STAGE      = 'a3e90324-df2f-4593-9d74-160b2d9c5f81';
const RESEND_KEY = 're_JknkKC6j_13yygp1KZtRXqxyeqrfMEJGu';

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

async function ghlPost(path, body) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GHL_TOKEN}`,
      Version: GHL_VER,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.msg || `GHL ${path} failed (${res.status})`);
  return data;
}

async function sendEmailAlert(fields) {
  const { firstName, lastName, businessName, email, phone, trade, revenue, reviewCount, reviewRating } = fields;
  const body = [
    `<h2>New Intake Submission</h2>`,
    `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">`,
    `<tr><td style="padding:6px 12px;font-weight:bold;">Name</td><td style="padding:6px 12px;">${firstName} ${lastName}</td></tr>`,
    `<tr><td style="padding:6px 12px;font-weight:bold;">Business</td><td style="padding:6px 12px;">${businessName}</td></tr>`,
    `<tr><td style="padding:6px 12px;font-weight:bold;">Email</td><td style="padding:6px 12px;">${email}</td></tr>`,
    `<tr><td style="padding:6px 12px;font-weight:bold;">Phone</td><td style="padding:6px 12px;">${phone || '—'}</td></tr>`,
    `<tr><td style="padding:6px 12px;font-weight:bold;">Trade</td><td style="padding:6px 12px;">${trade}</td></tr>`,
    `<tr><td style="padding:6px 12px;font-weight:bold;">Monthly Revenue</td><td style="padding:6px 12px;">${revenue || '—'}</td></tr>`,
    `<tr><td style="padding:6px 12px;font-weight:bold;">Google Reviews</td><td style="padding:6px 12px;">${reviewCount || '—'}</td></tr>`,
    `<tr><td style="padding:6px 12px;font-weight:bold;">Google Rating</td><td style="padding:6px 12px;">${reviewRating || '—'}</td></tr>`,
    `</table>`,
  ].join('\n');

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: 'Scale National <notifications@scalenational.com>',
      to: ['eric@scalenational.com'],
      subject: `New Intake: ${businessName} (${trade})`,
      html: body,
    }),
  });
}

export async function onRequest(context) {
  const { request } = context;

  // Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let fields;
  try {
    fields = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { firstName, lastName, businessName, email, phone, trade, revenue, reviewCount, reviewRating } = fields;

  // Validate required
  if (!firstName || !lastName || !businessName || !email || !phone || !trade) {
    return json({ error: 'Missing required fields' }, 400);
  }

  // 1. Create GHL contact
  let contactId;
  try {
    const contactRes = await ghlPost('/contacts/', {
      locationId: LOCATION,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      phone,
      companyName: businessName,
      tags: ['new-lead', 'website-intake'],
      source: 'scalenational.com intake',
    });
    contactId = contactRes.contact?.id || contactRes.id;
    if (!contactId) throw new Error('No contactId in response');
  } catch (err) {
    return json({ ok: false, error: `Contact creation failed: ${err.message}` }, 502);
  }

  // 2. Create opportunity
  let opportunityId;
  try {
    const oppRes = await ghlPost('/opportunities/', {
      locationId: LOCATION,
      pipelineId: PIPELINE,
      pipelineStageId: STAGE,
      contactId,
      name: `${businessName} — ${trade}`,
      status: 'open',
      monetaryValue: 0,
    });
    opportunityId = oppRes.opportunity?.id || oppRes.id;
  } catch (err) {
    // Partial success — contact created but opportunity failed
    try { await sendEmailAlert(fields); } catch {}
    return json({ ok: true, contactId, opportunityId: null, warning: `Opportunity creation failed: ${err.message}` });
  }

  // 3. Send email alert (fire and forget — don't fail the response)
  try {
    await sendEmailAlert(fields);
  } catch {}

  return json({ ok: true, contactId, opportunityId });
}
