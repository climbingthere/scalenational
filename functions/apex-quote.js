/**
 * Cloudflare Pages Function — /apex-quote
 * POST: Receives JSON from the Apex Roofing free quote form.
 *
 * Flow:
 *   1. Parse & validate required fields.
 *   2. Search GHL for existing contact by phone.
 *   3. Create or update GHL contact with tags.
 *   4. Add quote-request note to contact.
 */

const GHL_TOKEN    = 'pit-0f6cdeea-ddbf-4c1e-bdd7-5b1bd0d919d6';
const GHL_LOCATION = 'bxAx2g1z6Dd09kSdJZYt';
const GHL_BASE     = 'https://services.leadconnectorhq.com';
const GHL_VERSION  = '2021-07-28';

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

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST')    return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const {
    firstName = '',
    lastName = '',
    phone = '',
    description = '',
  } = body;

  // ── Validate required fields ───────────────────────────────────────
  if (!firstName.trim()) return json({ error: 'First name is required' }, 400);
  if (!phone.trim())     return json({ error: 'Phone is required' }, 400);

  // ── GHL Integration ────────────────────────────────────────────────
  try {
    const ghlHeaders = {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GHL_TOKEN}`,
      'Version':       GHL_VERSION,
    };

    // ── 1. Search for existing contact by phone ─────────────────────
    let contactId = null;

    if (phone.trim()) {
      const searchRes = await fetch(
        `${GHL_BASE}/contacts/?locationId=${GHL_LOCATION}&query=${encodeURIComponent(phone.trim())}`,
        { headers: ghlHeaders }
      );
      const searchData = await searchRes.json();
      const match = searchData?.contacts?.[0];
      if (match?.id) contactId = match.id;
    }

    // ── 2. Create or update contact ─────────────────────────────────
    const contactPayload = {
      locationId:  GHL_LOCATION,
      firstName:   firstName.trim(),
      lastName:    lastName.trim(),
      phone:       phone.trim(),
      tags:        ['apex-roofing-lead', 'free-quote-request'],
      source:      'apex-roofing-form',
    };

    if (contactId) {
      await fetch(`${GHL_BASE}/contacts/${contactId}`, {
        method:  'PUT',
        headers: ghlHeaders,
        body:    JSON.stringify(contactPayload),
      });
    } else {
      const createRes = await fetch(`${GHL_BASE}/contacts/`, {
        method:  'POST',
        headers: ghlHeaders,
        body:    JSON.stringify(contactPayload),
      });
      const createData = await createRes.json();
      contactId = createData?.contact?.id || createData?.meta?.contactId;
    }

    if (!contactId) {
      console.error('GHL: could not find or create contact');
      return json({ error: 'Failed to resolve contact in CRM' }, 422);
    }

    // ── 3. Add quote-request note to contact ────────────────────────
    const noteBody = [
      'FREE QUOTE REQUEST',
      '',
      `NAME: ${firstName.trim()} ${lastName.trim()}`,
      `PHONE: ${phone.trim()}`,
      '',
      'DESCRIPTION:',
      description.trim(),
    ].join('\n');

    await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
      method:  'POST',
      headers: ghlHeaders,
      body:    JSON.stringify({ body: noteBody }),
    });

  } catch (err) {
    console.error('GHL error:', err?.message || err);
    return json({ error: 'Internal error processing submission' }, 422);
  }

  return json({ ok: true });
}
