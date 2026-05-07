/**
 * Cloudflare Pages Function — /leads-data
 * GET: Returns contacts from GHL for the read-only lead dashboard.
 * Protected by a simple PIN query parameter.
 */

const GHL_TOKEN    = 'pit-0f6cdeea-ddbf-4c1e-bdd7-5b1bd0d919d6';
const GHL_LOCATION = 'bxAx2g1z6Dd09kSdJZYt';
const GHL_BASE     = 'https://services.leadconnectorhq.com';
const GHL_VERSION  = '2021-07-28';

const VALID_PIN = '4471';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  if (request.method !== 'GET')     return json({ error: 'Method not allowed' }, 405);

  // ── PIN check ───────────────────────────────────────────────────
  const url = new URL(request.url);
  const pin = url.searchParams.get('pin');

  if (pin !== VALID_PIN) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const ghlHeaders = {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GHL_TOKEN}`,
      'Version':       GHL_VERSION,
    };

    // ── Fetch contacts ──────────────────────────────────────────
    const res = await fetch(
      `${GHL_BASE}/contacts/?locationId=${GHL_LOCATION}&limit=50&sortBy=dateAdded&order=desc`,
      { headers: ghlHeaders }
    );
    const data = await res.json();

    if (!data?.contacts) {
      return json({ ok: true, contacts: [], total: 0 });
    }

    // ── Map contacts ────────────────────────────────────────────
    const contacts = data.contacts.map(c => ({
      id:        c.id,
      name:      [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown',
      phone:     c.phone || '',
      email:     c.email || '',
      tags:      c.tags || [],
      dateAdded: c.dateAdded || c.createdAt || '',
      source:    c.source || '',
      notes:     '',  // Notes require per-contact API calls; skipped for performance
    }));

    // Sort by dateAdded descending (in case API didn't honour sortBy)
    contacts.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    return json({ ok: true, contacts, total: contacts.length });

  } catch (err) {
    console.error('leads-data error:', err?.message || err);
    return json({ error: 'Failed to fetch leads' }, 500);
  }
}
