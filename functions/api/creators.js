/**
 * Cloudflare Pages Function — /api/creators
 * Handles creator applications: GET (list), POST (submit), PATCH (update status)
 * KV binding: CREATORS_KV
 */

const CORS = {
  'Access-Control-Allow-Origin': 'https://scalenational.com',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Vary': 'Origin',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function requireAdminKey(request, env) {
  if (!env.ADMIN_API_KEY) return null; // If not configured, skip check (dev mode)
  const auth = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (auth !== env.ADMIN_API_KEY) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return null;
}

// GET /api/creators — list all creators (portal use)
// GET /api/creators?id=xxx — single creator
async function handleGet(request, env) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (id) {
    // Single creator by ID — stays open so client dashboard can load its own data
    const creator = await env.CREATORS_KV.get(`creator:${id}`, 'json');
    if (!creator) return json({ error: 'Not found' }, 404);
    return json(creator);
  }

  // List all — requires admin key
  const authErr = requireAdminKey(request, env);
  if (authErr) return authErr;

  // KV list with prefix
  const list = await env.CREATORS_KV.list({ prefix: 'creator:' });
  const creators = await Promise.all(
    list.keys.map(k => env.CREATORS_KV.get(k.name, 'json'))
  );
  return json(creators.filter(Boolean));
}

// POST /api/creators — new creator application
async function handlePost(request, env) {
  // Rate limiting
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const hourBucket = Math.floor(Date.now() / 3600000);
  const rateKey = `rate:${ip}:${hourBucket}`;
  const rateCount = parseInt(await env.CREATORS_KV.get(rateKey) || '0');
  if (rateCount >= 5) {
    return json({ error: 'Too many submissions. Please try again later.' }, 429);
  }
  await env.CREATORS_KV.put(rateKey, String(rateCount + 1), { expirationTtl: 3600 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Validate required fields
  const required = ['fullName', 'email', 'location', 'timezone', 'primaryPlatform', 'primaryHandle', 'primaryNiche'];
  for (const field of required) {
    if (!body[field]) return json({ error: `Missing required field: ${field}` }, 400);
  }

  // Email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return json({ error: 'Invalid email address' }, 400);
  }
  // Prevent oversized payloads
  const bodyStr = JSON.stringify(body);
  if (bodyStr.length > 50000) {
    return json({ error: 'Request too large' }, 413);
  }
  // Sanitize text fields — strip HTML tags
  const sanitize = (s) => typeof s === 'string' ? s.replace(/<[^>]*>/g, '').slice(0, 1000) : s;
  ['fullName', 'location', 'primaryHandle', 'notes'].forEach(k => {
    if (body[k]) body[k] = sanitize(body[k]);
  });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const creator = {
    id,
    ...body,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    notes: '',
  };

  await env.CREATORS_KV.put(`creator:${id}`, JSON.stringify(creator));
  return json({ success: true, id }, 201);
}

// PATCH /api/creators?id=xxx — update status or notes
async function handlePatch(request, env) {
  const authErr = requireAdminKey(request, env);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400);

  const existing = await env.CREATORS_KV.get(`creator:${id}`, 'json');
  if (!existing) return json({ error: 'Not found' }, 404);

  let updates;
  try {
    updates = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const updated = { ...existing, ...updates, id };
  await env.CREATORS_KV.put(`creator:${id}`, JSON.stringify(updated));
  return json({ success: true, creator: updated });
}

// DELETE /api/creators?id=xxx
async function handleDelete(request, env) {
  const authErr = requireAdminKey(request, env);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400);

  await env.CREATORS_KV.delete(`creator:${id}`);
  return json({ success: true });
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  // Preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (!env.CREATORS_KV) {
    return json({ error: 'KV not configured — bind CREATORS_KV in Cloudflare dashboard' }, 500);
  }

  try {
    if (method === 'GET')    return await handleGet(request, env);
    if (method === 'POST')   return await handlePost(request, env);
    if (method === 'PATCH')  return await handlePatch(request, env);
    if (method === 'DELETE') return await handleDelete(request, env);
    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
