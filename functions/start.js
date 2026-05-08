/**
 * Cloudflare Pages Function — /start
 * GET:  Pass through to static HTML.
 * POST: Receives JSON from the qualifying funnel form.
 *
 * Flow:
 *   1. Validate required fields (firstName, lastName, phone, email).
 *   2. Create GHL contact with tags and custom fields.
 *   3. Create opportunity in Marketing Pipeline at New Lead stage.
 *   4. Add note with all qualifying answers.
 *   5. Return { ok: true }.
 */

const GHL_TOKEN    = 'pit-0f6cdeea-ddbf-4c1e-bdd7-5b1bd0d919d6';
const GHL_LOCATION = 'bxAx2g1z6Dd09kSdJZYt';
const GHL_BASE     = 'https://services.leadconnectorhq.com';
const GHL_VERSION  = '2021-07-28';

const PIPELINE_ID  = 'VxsnPyFkv6rjjHDA30M7';
const STAGE_NEW    = 'a3e90324-df2f-4593-9d74-160b2d9c5f81';

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
  if (request.method !== 'POST')   return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // ── Validate required fields ──────────────────────────────────────
  const { firstName, lastName, phone, email, trade, leadSource, revenue, isOwner, painPoint, investment } = body;

  if (!firstName || !lastName || !phone || !email) {
    return json({ error: 'firstName, lastName, phone, and email are required' }, 400);
  }

  // ── GHL ───────────────────────────────────────────────────────────
  try {
    const ghlHeaders = {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GHL_TOKEN}`,
      'Version':       GHL_VERSION,
    };

    // ── 1. Create contact ───────────────────────────────────────────
    const createRes = await fetch(`${GHL_BASE}/contacts/`, {
      method:  'POST',
      headers: ghlHeaders,
      body:    JSON.stringify({
        locationId:  GHL_LOCATION,
        firstName,
        lastName,
        email,
        phone,
        tags:   ['meta-ad-lead', 'qualified-lead'],
        source: 'meta-ads-funnel',
        customFields: [
          { id: 'nMLwyym5kB1IDELNCQ0x', field_value: trade || '' },
          { id: '5UKidYH3nEkQZhYwh4vY', field_value: revenue || '' },
        ],
      }),
    });

    const createData = await createRes.json();
    let contactId = createData?.contact?.id || createData?.meta?.contactId;

    // If contact already exists, search for it
    if (!contactId) {
      for (const query of [email, phone].filter(Boolean)) {
        const searchRes = await fetch(
          `${GHL_BASE}/contacts/?locationId=${GHL_LOCATION}&query=${encodeURIComponent(query)}`,
          { headers: ghlHeaders }
        );
        const searchData = await searchRes.json();
        const match = searchData?.contacts?.[0];
        if (match?.id) { contactId = match.id; break; }
      }

      // Update existing contact with new data
      if (contactId) {
        await fetch(`${GHL_BASE}/contacts/${contactId}`, {
          method:  'PUT',
          headers: ghlHeaders,
          body:    JSON.stringify({
            firstName,
            lastName,
            email,
            phone,
            tags:   ['meta-ad-lead', 'qualified-lead'],
            source: 'meta-ads-funnel',
            customFields: [
              { id: 'nMLwyym5kB1IDELNCQ0x', field_value: trade || '' },
              { id: '5UKidYH3nEkQZhYwh4vY', field_value: revenue || '' },
            ],
          }),
        });
      }
    }

    if (!contactId) {
      console.error('GHL: could not find or create contact');
      return json({ error: 'Failed to resolve contact in CRM' }, 422);
    }

    // ── 2. Create opportunity in Marketing Pipeline ─────────────────
    const oppName = `${firstName} ${lastName} — ${trade || 'Unknown Trade'}`;
    await fetch(`${GHL_BASE}/opportunities/`, {
      method:  'POST',
      headers: ghlHeaders,
      body:    JSON.stringify({
        locationId:      GHL_LOCATION,
        contactId,
        name:            oppName,
        pipelineId:      PIPELINE_ID,
        pipelineStageId: STAGE_NEW,
        status:          'open',
      }),
    });

    // ── 3. Add note with qualifying answers ─────────────────────────
    const noteBody = [
      `=== META ADS FUNNEL SUBMISSION ===`,
      ``,
      `NAME: ${firstName} ${lastName}`,
      `PHONE: ${phone}`,
      `EMAIL: ${email}`,
      ``,
      `OWNER / DECISION MAKER: ${isOwner || 'Not specified'}`,
      `TRADE: ${trade || 'Not specified'}`,
      `MONTHLY REVENUE: ${revenue || 'Not specified'}`,
      `CURRENT LEAD SOURCE: ${leadSource || 'Not specified'}`,
      `BIGGEST CHALLENGE: ${painPoint || 'Not specified'}`,
      `INVESTMENT RANGE: ${investment || 'Not specified'}`,
      ``,
      `SOURCE: Meta Ads Qualifying Funnel (/start)`,
    ].join('\n');

    await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
      method:  'POST',
      headers: ghlHeaders,
      body:    JSON.stringify({ body: noteBody }),
    });

  } catch (err) {
    console.error('GHL error:', err?.message || err);
    return json({ error: 'Internal error processing lead' }, 422);
  }

  return json({ ok: true });
}
