import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import {
  VIEW_DEDUPE_SECONDS, isLikelyBot, recordPropertyView, viewCookieName,
} from '@/lib/property-views';

/**
 * One view of a listing, sent by the property page once it has loaded in a
 * browser. Not counted: bots, the listing's own agent, staff, and the same
 * browser again within 30 minutes. Always answers 204 so the beacon never
 * shows an error to a visitor.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const done = () => new NextResponse(null, { status: 204 });

  if (isLikelyBot(request.headers.get('user-agent'))) return done();

  const cookieName = viewCookieName(id);
  if (request.headers.get('cookie')?.split(/;\s*/).some((c) => c.startsWith(`${cookieName}=`))) {
    return done();
  }

  const [session, listing] = await Promise.all([
    getSession(),
    prisma.property.findUnique({ where: { id }, select: { hostId: true } }),
  ]);
  if (!listing) return done();
  if (session && (session.role === 'ADMIN' || session.id === listing.hostId)) return done();

  await recordPropertyView(id);

  const res = done();
  res.cookies.set(cookieName, '1', {
    maxAge: VIEW_DEDUPE_SECONDS,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return res;
}
