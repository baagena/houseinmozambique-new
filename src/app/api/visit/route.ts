import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { isLikelyBot } from '@/lib/property-views';
import { VISIT_COOKIE, maputoDay, recordVisit } from '@/lib/site-traffic';

/**
 * One public page load. Not counted: bots and link previews, staff (admins
 * checking the site), and anything outside production — the local dev server
 * shares the production database, so testing would otherwise inflate the
 * real numbers. Always 204, so a visitor never sees an error from it.
 */
export async function POST(request: Request) {
  const done = () => new NextResponse(null, { status: 204 });

  if (process.env.NODE_ENV !== 'production') return done();
  if (isLikelyBot(request.headers.get('user-agent'))) return done();

  const session = await getSession();
  if (session?.role === 'ADMIN') return done();

  const today = maputoDay();
  const seenToday = request.headers
    .get('cookie')
    ?.split(/;\s*/)
    .some((c) => c === `${VISIT_COOKIE}=${today}`);

  try {
    await recordVisit(!seenToday, today);
  } catch (error) {
    console.error('recordVisit failed:', error);
    return done();
  }

  const res = done();
  if (!seenToday) {
    res.cookies.set(VISIT_COOKIE, today, {
      maxAge: 2 * 24 * 60 * 60, // the value, not the expiry, decides "today"
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  }
  return res;
}
