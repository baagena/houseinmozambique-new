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
    const url = request.nextUrl.clone();
    url.pathname = unprefixed;
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? PT_PREFIX : `${PT_PREFIX}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Pages and API routes; not build assets or files with an extension
  // (sitemap.xml, robots.txt, images).
  matcher: ['/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)'],
};
