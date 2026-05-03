export async function onRequestPost({ request }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  let body;
  try { body = await request.json(); } catch (e) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: cors });
  }

  const { cid, lid, rating } = body;
  const GHL_TOKEN = 'pit-99d7b12e-693a-4577-b431-32fbbaf40ac1';

  if (!cid) {
    return new Response(JSON.stringify({ ok: false, error: 'missing cid' }), { status: 400, headers: cors });
  }

  try {
    // Add tag "reviewed-positive"
    await fetch(`https://services.leadconnectorhq.com/contacts/${cid}/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_TOKEN}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tags: ['reviewed-positive'] })
    });

    // Add note to contact
    await fetch(`https://services.leadconnectorhq.com/contacts/${cid}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_TOKEN}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        body: `Customer left a positive review (rating: ${rating}/5) via review funnel`,
        userId: 'Dj7WGTAWQ14PhUA82yX7'
      })
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: cors });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
