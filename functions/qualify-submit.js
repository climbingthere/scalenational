/**
 * Cloudflare Pages Function — /qualify-submit
 * POST: Receives JSON from the qualifying funnel.
 *
 * Flow:
 *   1. Parse & validate required fields.
 *   2. Search GHL for existing contact by phone.
 *   3. Create or update GHL contact with tags + custom fields.
 *   4. Create opportunity in Marketing Pipeline → New Lead stage.
 *   5. Add qualifying-answers note to contact.
 */

const GHL_TOKEN    = 'pit-0f6cdeea-ddbf-4c1e-bdd7-5b1bd0d919d6';
const GHL_LOCATION = 'bxAx2g1z6Dd09kSdJZYt';
const GHL_BASE     = 'https://services.leadconnectorhq.com';
const GHL_VERSION  = '2021-07-28';

const PIPELINE_ID = 'VxsnPyFkv6rjjHDA30M7';
const STAGE_NEW_LEAD = 'a3e90324-df2f-4593-9d74-160b2d9c5f81';

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
    businessName = '',
    city = '',
    trade = '',
    revenue = '',
    leadSource = '',
  } = body;

  // ── Validate required fields ───────────────────────────────────────
  if (!firstName.trim()) return json({ error: 'First name is required' }, 400);
  if (!phone.trim())     return json({ error: 'Phone is required' }, 400);
  if (!businessName.trim()) return json({ error: 'Business name is required' }, 400);

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
      companyName: businessName.trim(),
      address1:    city.trim(),
      tags:        ['meta-ads-lead', 'qualify-funnel'],
      source:      'meta-ads-qualify',
      customFields: [
        { id: 'nMLwyym5kB1IDELNCQ0x', field_value: trade },
      ],
    };

    if (contactId) {
      // Update existing contact
      await fetch(`${GHL_BASE}/contacts/${contactId}`, {
        method:  'PUT',
        headers: ghlHeaders,
        body:    JSON.stringify(contactPayload),
      });
    } else {
      // Create new contact
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

    // ── 3. Create opportunity in Marketing Pipeline ─────────────────
    await fetch(`${GHL_BASE}/opportunities/`, {
      method:  'POST',
      headers: ghlHeaders,
      body:    JSON.stringify({
        locationId:      GHL_LOCATION,
        contactId,
        name:            `${businessName.trim()} — Meta Qualify`,
        pipelineId:      PIPELINE_ID,
        pipelineStageId: STAGE_NEW_LEAD,
        status:          'open',
      }),
    });

    // ── 4. Add qualifying note to contact ───────────────────────────
    const noteBody = [
      '=== META ADS QUALIFYING FUNNEL ===',
      '',
      `NAME: ${firstName.trim()} ${lastName.trim()}`,
      `PHONE: ${phone.trim()}`,
      `BUSINESS: ${businessName.trim()}`,
      `CITY/STATE: ${city.trim()}`,
      '',
      `TRADE: ${trade}`,
      `MONTHLY REVENUE: ${revenue}`,
      `CURRENT LEAD SOURCE: ${leadSource}`,
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
