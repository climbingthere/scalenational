export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === 'grow.scalenational.com') {
    const assetUrl = new URL(context.request.url);
    // Serve /grow/index.html for root, otherwise rewrite path under /grow/
    if (url.pathname === '/' || url.pathname === '') {
      assetUrl.pathname = '/grow/index.html';
    } else {
      assetUrl.pathname = '/grow' + url.pathname;
    }
    return context.env.ASSETS.fetch(assetUrl.toString());
  }

  return context.next();
}
