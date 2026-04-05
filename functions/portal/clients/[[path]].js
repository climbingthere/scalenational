export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname; // e.g. /portal/clients/demo.json

  // Only handle .json files
  if (!pathname.endsWith('.json')) {
    return context.next();
  }

  // Check admin key first
  if (env.ADMIN_API_KEY) {
    const auth = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
    if (auth === env.ADMIN_API_KEY) {
      return context.next(); // Admin - allow through
    }
  }

  // Check client password via query param
  const clientPw = url.searchParams.get('pw');
  if (!clientPw) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fetch the file to verify the password hash matches
  const fileResp = await context.next();
  if (!fileResp.ok) return fileResp;

  const data = await fileResp.clone().json().catch(() => null);
  if (!data?.meta?.accessPasswordHash) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (clientPw !== data.meta.accessPasswordHash) {
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return fileResp;
}
