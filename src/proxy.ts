import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LANG_HEADER, isEnglishPath, stripLangPrefix } from '@/lib/site-lang';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function isCorsPath(pathname: string) {
  return pathname.startsWith('/api/mobile/') || pathname === '/api/inquiries';
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

  /* The language header is ours alone: dropped from every request, then set
     only for the /en addresses (see lib/site-lang.ts). */
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(LANG_HEADER);

  if (isEnglishPath(pathname)) {
    requestHeaders.set(LANG_HEADER, 'en');
    const url = request.nextUrl.clone();
    url.pathname = stripLangPrefix(pathname);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Pages and API routes; not build assets or files with an extension
  // (sitemap.xml, robots.txt, images).
  matcher: ['/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)'],
};
