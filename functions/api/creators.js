/**
 * Cloudflare Pages Function — /api/creators
 * Handles creator applications: GET (list), POST (submit), PATCH (update status)
 * KV binding: CREATORS_KV
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// GET /api/creators — list all creators (portal use)
// GET /api/creators?id=xxx — single creator
async function handleGet(request, env) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (id) {
    const creator = await env.CREATORS_KV.get(`creator:${id}`, 'json');
    if (!creator) return json({ error: 'Not found' }, 404);
    return json(creator);
  }

  // List all — KV list with prefix
  const list = await env.CREATORS_KV.list({ prefix: 'creator:' });
  const creators = await Promise.all(
    list.keys.map(k => env.CREATORS_KV.get(k.name, 'json'))
  );
  return json(creators.filter(Boolean));
}

// POST /api/creators — new creator application
async function handlePost(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Validate required fields
  const required = ['fullName', 'email', 'location', 'timezone', 'primaryPlatform', 'primaryHandle', 'totalFollowing', 'avgViews', 'primaryNiche', 'bestVideoLink'];
  for (const field of required) {
    if (!body[field]) return json({ error: `Missing required field: ${field}` }, 400);
  }

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
