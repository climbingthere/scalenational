/**
 * Cloudflare Pages Function — /review-trigger
 * POST: Receives customer info from the contractor's review-trigger page.
 *
 * Flow:
 *   1. Parse JSON body (firstName, lastName, phone, notes).
 *   2. Search GHL for existing contact by phone.
 *   3. If found → use existing contactId + add 'review-requested' tag.
 *   4. If not found → create new contact with tag.
 *   5. Add note to contact with job details.
 *   6. Return { ok, contactId, name }.
 *
 * The GHL workflow "5 Star Review Funnel" (b0bc6f64-20cc-49d1-bc1f-fe6b5cba3fbb)
 * should auto-fire when the 'review-requested' tag is added.
 * Eric: verify that workflow has a "Tag Added = review-requested" trigger in GHL.
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

  const { firstName, lastName, phone, notes } = body;

  if (!firstName || !phone) {
    return json({ error: 'firstName and phone are required' }, 400);
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  try {
    const ghlHeaders = {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GHL_TOKEN}`,
      'Version':       GHL_VERSION,
    };

    // ── 1. Search for existing contact by phone ─────────────────────
    let contactId = null;
    let existingTags = [];

    const searchRes = await fetch(
      `${GHL_BASE}/contacts/?locationId=${GHL_LOCATION}&query=${encodeURIComponent(phone)}`,
      { headers: ghlHeaders }
    );
    const searchData = await searchRes.json();
    const match = searchData?.contacts?.[0];

    if (match?.id) {
      contactId = match.id;
      existingTags = match.tags || [];
    }

    // ── 2. Create or update contact ─────────────────────────────────
    if (contactId) {
      // Existing contact — merge in the review-requested tag
      const mergedTags = [...new Set([...existingTags, 'review-requested'])];
      await fetch(`${GHL_BASE}/contacts/${contactId}`, {
        method:  'PUT',
        headers: ghlHeaders,
        body:    JSON.stringify({
          firstName,
          lastName: lastName || undefined,
          tags: mergedTags,
        }),
      });
    } else {
      // New contact
      const createRes = await fetch(`${GHL_BASE}/contacts/`, {
        method:  'POST',
        headers: ghlHeaders,
        body:    JSON.stringify({
          locationId: GHL_LOCATION,
          firstName,
          lastName:   lastName || '',
          phone,
          tags:       ['review-requested'],
          source:     'review-trigger',
        }),
      });
      const createData = await createRes.json();
      contactId = createData?.contact?.id || createData?.meta?.contactId;
    }

    if (!contactId) {
      console.error('review-trigger: could not find or create contact');
      return json({ error: 'Failed to resolve contact in CRM' }, 422);
    }

    // ── 3. Add note ─────────────────────────────────────────────────
    const noteBody = `Review request triggered by contractor.\nCustomer: ${fullName}\nPhone: ${phone}\nJob notes: ${notes || 'none'}`;

    await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
      method:  'POST',
      headers: ghlHeaders,
      body:    JSON.stringify({ body: noteBody }),
    });

    // ── Done ────────────────────────────────────────────────────────
    return json({ ok: true, contactId, name: fullName });

  } catch (err) {
    console.error('review-trigger error:', err?.message || err);
    return json({ error: 'Internal error processing review trigger' }, 422);
  }
}
