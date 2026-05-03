export async function onRequestGet({ request }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  const url = new URL(request.url);
  const lid = url.searchParams.get('lid');

  const defaults = {
    bizName: 'Us',
    logoUrl: '',
    googleUrl: '',
    brandColor: '#FF5A1F'
  };

  if (!lid) {
    return new Response(JSON.stringify(defaults), { status: 200, headers: cors });
  }

  const GHL_TOKEN = 'pit-99d7b12e-693a-4577-b431-32fbbaf40ac1';
  const ghlHeaders = {
    'Authorization': `Bearer ${GHL_TOKEN}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json'
  };

  try {
    const [fieldsRes, locationRes] = await Promise.all([
      fetch(`https://services.leadconnectorhq.com/locations/${lid}/customFields`, { headers: ghlHeaders }),
      fetch(`https://services.leadconnectorhq.com/locations/${lid}`, { headers: ghlHeaders })
    ]);

    let bizName = defaults.bizName;
    let logoUrl = defaults.logoUrl;
    let googleUrl = defaults.googleUrl;
    let brandColor = defaults.brandColor;

    if (locationRes.ok) {
      const locationData = await locationRes.json();
      const loc = locationData.location || locationData;
      bizName = loc.name || defaults.bizName;
    }

    if (fieldsRes.ok) {
      const fieldsData = await fieldsRes.json();
      const fields = fieldsData.customFields || [];

      for (const field of fields) {
        const name = (field.name || '').trim();
        const value = (field.value || field.fieldValue || '').trim();

        if (name === 'Google Review URL' && value) googleUrl = value;
        if (name === 'Logo URL' && value) logoUrl = value;
        if (name === 'Brand Color' && value) brandColor = value;
      }
    }

    return new Response(JSON.stringify({ bizName, logoUrl, googleUrl, brandColor }), {
      status: 200,
      headers: cors
    });
  } catch (e) {
    return new Response(JSON.stringify(defaults), { status: 200, headers: cors });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
