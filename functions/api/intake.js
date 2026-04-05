/**
 * Cloudflare Pages Function — /api/intake
 * Handles client intake form submissions: GET (list), POST (submit), PATCH (update status), DELETE
 * KV binding: INTAKE_KV
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

// Sanitize text fields: strip HTML tags, limit 2000 chars
const sanitize = (s) => typeof s === 'string' ? s.replace(/<[^>]*>/g, '').slice(0, 2000) : s;

// GET /api/intake — list all submissions (admin only)
// GET /api/intake?id=xxx — single submission (admin only)
async function handleGet(request, env) {
  const authErr = requireAdminKey(request, env);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (id) {
    const submission = await env.INTAKE_KV.get(`intake:${id}`, 'json');
    if (!submission) return json({ error: 'Not found' }, 404);
    return json(submission);
  }

  // List all
  const list = await env.INTAKE_KV.list({ prefix: 'intake:' });
  const submissions = await Promise.all(
    list.keys.map(k => env.INTAKE_KV.get(k.name, 'json'))
  );
  return json(submissions.filter(Boolean));
}

// POST /api/intake — new intake submission (public)
async function handlePost(request, env) {
  // Rate limiting: 3 per hour per IP
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const hourBucket = Math.floor(Date.now() / 3600000);
  const rateKey = `rate:${ip}:${hourBucket}`;
  const rateCount = parseInt(await env.INTAKE_KV.get(rateKey) || '0');
  if (rateCount >= 3) {
    return json({ error: 'Too many submissions. Please try again later.' }, 429);
  }
  await env.INTAKE_KV.put(rateKey, String(rateCount + 1), { expirationTtl: 3600 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Validate required fields
  const required = ['businessName', 'contactName', 'email'];
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

  // Sanitize all string fields
  const sanitized = {};
  for (const [key, val] of Object.entries(body)) {
    sanitized[key] = sanitize(val);
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const submission = {
    id,
    ...sanitized,
    status: 'new',
    submittedAt: new Date().toISOString(),
  };

  await env.INTAKE_KV.put(`intake:${id}`, JSON.stringify(submission));
  return json({ success: true, id }, 201);
}

// PATCH /api/intake?id=xxx — update status or fields (admin only)
// Valid status transitions: new → reviewed → contacted → converted
async function handlePatch(request, env) {
  const authErr = requireAdminKey(request, env);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400);

  const existing = await env.INTAKE_KV.get(`intake:${id}`, 'json');
  if (!existing) return json({ error: 'Not found' }, 404);

  let updates;
  try {
    updates = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Validate status if provided
  const validStatuses = ['new', 'reviewed', 'contacted', 'converted'];
  if (updates.status && !validStatuses.includes(updates.status)) {
    return json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 400);
  }

  const updated = { ...existing, ...updates, id };
  await env.INTAKE_KV.put(`intake:${id}`, JSON.stringify(updated));
  return json({ success: true, submission: updated });
}

// DELETE /api/intake?id=xxx (admin only)
async function handleDelete(request, env) {
  const authErr = requireAdminKey(request, env);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400);

  await env.INTAKE_KV.delete(`intake:${id}`);
  return json({ success: true });
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  // Preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (!env.INTAKE_KV) {
    return json({ error: 'KV not configured — bind INTAKE_KV in Cloudflare dashboard' }, 500);
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
