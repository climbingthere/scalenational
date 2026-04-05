/**
 * /api/admin-token — Exchange admin hash for API key
 * Client authenticates with SHA-256 hash, receives ADMIN_API_KEY for subsequent calls
 */

const CORS_ORIGIN = 'https://scalenational.com';
const ADMIN_HASH = 'e97f43b5cff898d80583af2bf6becf35ea2d2980abc932e49586b3e8e03e9f28';

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...extra,
    },
  });
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': CORS_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!env.ADMIN_API_KEY) {
    return json({ error: 'Not configured' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { hash } = body || {};
  if (!hash || hash !== ADMIN_HASH) {
    return json({ error: 'Unauthorized' }, 401);
  }

  return json({ token: env.ADMIN_API_KEY }, 200, {
    'Cache-Control': 'no-store',
  });
}
