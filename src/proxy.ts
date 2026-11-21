import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PT_PREFIX, isEnglishPath, stripPtPrefix } from '@/lib/site-lang';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function isCorsPath(pathname: string) {
  return pathname.startsWith('/api/mobile/') || pathname === '/api/inquiries';
}

/*
 * Routes that live outside src/app/[lang] and are served as they are: API
 * routes, files (public/, sitemap.xml, robots.txt), and the file-convention
 * routes at the app root whose address has no extension (the Open Graph
 * image). Everything else is a page.
 *
 * Files are checked here as well as in the matcher below: the matcher let
 * through the social icons, whose names hold spaces, commas and "=", and
 * rewriting those onto /pt/... answered them with the 404 page.
 */
function isUnlocalized(pathname: string) {
  return (
    /\.[a-zA-Z0-9]+$/.test(pathname) ||
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/opengraph-image') ||
    pathname.startsWith('/_vercel') ||
    pathname.startsWith('/__')
  );
}

/*
 * Where a visitor is sent by a redirect: the public address they used (behind
 * nginx on the VPS, Next itself only sees its internal address).
 */
function publicUrl(request: NextRequest): URL {
  const url = request.nextUrl.clone();
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host'))?.split(',')[0].trim();
  if (host) {
    const [hostname, port] = host.split(':');
    url.hostname = hostname;
    url.port = port ?? '';
  }
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  if (proto === 'http' || proto === 'https') url.protocol = `${proto}:`;
  return url;
}

/*
 * The base for an internal rewrite (/x → /pt/x). Next only serves a rewrite
 * itself when its origin equals the server's own address; any other origin
 * is fetched over the network like an external site. On Vercel nextUrl is
 * that address. Self-hosted (Docker, SELF_HOSTED=1) the server's address is
 * HOSTNAME:PORT, with https when nginx forwards an https request — the same
 * rule Next uses (router-utils/resolve-routes, initURL).
 */
function rewriteBase(request: NextRequest): URL {
  const url = request.nextUrl.clone();
  if (process.env.SELF_HOSTED === '1') {
    const https = (request.headers.get('x-forwarded-proto') ?? '').includes('https');
    url.protocol = https ? 'https:' : 'http:';
    url.hostname = process.env.HOSTNAME || 'localhost';
    url.port = process.env.PORT || '3000';
  }
  return url;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isCorsPath(pathname)) {
    if (request.method === 'OPTIONS') {
      return NextResponse.json({}, { headers: corsHeaders });
    }

    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  if (isUnlocalized(pathname)) return NextResponse.next();

  /*
   * Pages live under src/app/[lang] (see lib/site-lang.ts). English keeps its
   * public /en prefix, which is already the internal path. Portuguese has no
   * prefix in public, so /x is served by /pt/x.
   */
  if (isEnglishPath(pathname)) return NextResponse.next();

  // /pt/... is internal only: one address per page, so send it to the real one.
  const unprefixed = stripPtPrefix(pathname);
  if (unprefixed !== null) {
    const url = publicUrl(request);
    url.pathname = unprefixed;
    return NextResponse.redirect(url, 308);
  }

  const url = rewriteBase(request);
  url.pathname = pathname === '/' ? PT_PREFIX : `${PT_PREFIX}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Pages and API routes; not build assets or files with an extension
  // (sitemap.xml, robots.txt, images).
  matcher: ['/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)'],
};
