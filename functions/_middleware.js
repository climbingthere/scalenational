/**
 * Cloudflare Pages Middleware — subdomain routing
 * Maps short subdomains to the correct page on scalenational.com
 */
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const host = url.hostname;

  const subdomainMap = {
    'onboarding.scalenational.com': 'https://scalenational.com/onboarding',
    'sample.scalenational.com':     'https://scalenational.com/sample/',
    'leads.scalenational.com':      'https://scalenational.com/leads',
  };

  const target = subdomainMap[host];
  if (target && url.pathname === '/') {
    return Response.redirect(target, 302);
  }

  return next();
}
