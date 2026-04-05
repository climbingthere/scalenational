/**
 * Cloudflare Pages Middleware — subdomain routing
 * Maps short subdomains to the correct page on scalenational.com
 */
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const host = url.hostname;

  const subdomainMap = {
    'deck.scalenational.com':    'https://scalenational.com/discovery-deck.html',
    'scripts.scalenational.com': 'https://scalenational.com/dm-scripts.html',
    'apply.scalenational.com':   'https://scalenational.com/creator-signup.html',
    'intake.scalenational.com':  'https://scalenational.com/portal/client-intake.html',
    'onepager.scalenational.com': 'https://scalenational.com/one-pager.html',
  };

  const target = subdomainMap[host];
  if (target && url.pathname === '/') {
    return Response.redirect(target, 302);
  }

  return next();
}
