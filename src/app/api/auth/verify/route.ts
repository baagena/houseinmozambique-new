import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/session';

/**
 * GET /api/auth/verify — confirms an email address and signs the person in.
 *
 * It used to verify the address and then redirect to `/auth?verified=1`, which
 * asked somebody who had just proved they own the mailbox to go and type their
 * password. For an owner who only wanted to post one house that is three
 * screens of friction between them and the listing form, and the commonest
 * place to lose them: they clicked the link on a phone, landed on a sign-in
 * box, and did not remember the password they chose ninety seconds earlier.
 *
 * Clicking a single-use token sent to that address is the same proof a password
 * gives, so the session is issued here.
 */

/**
 * Only same-site paths are honoured as a destination.
 *
 * `next` arrives from a link in an email, so treating it as a general redirect
 * would turn this endpoint into an open redirect — a phisher could send
 * "verify your account" pointing at our domain and bounce the click anywhere.
 * A leading `//` is rejected too: `//evil.example` is a protocol-relative URL,
 * not a path.
 */
function safeNext(raw: string | null): string {
  if (!raw) return '/dashboard/agent';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard/agent';
  return raw;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/auth?error=missing-token', request.url));
  }

  const agent = await prisma.agent.findFirst({
    where: { emailVerifyToken: token, emailVerifyExpiresAt: { gt: new Date() } },
    select: { id: true, role: true, emailVerifiedAt: true },
  });

  if (!agent) {
    /*
     * Redirect rather than return JSON. This URL is opened by a person in a
     * browser, and the old handler answered a stale or reused link with a raw
     * `{"error": ...}` document — which reads as the site being broken rather
     * than as a link that has already been used.
     */
    return NextResponse.redirect(new URL('/auth?error=invalid-token', request.url));
  }

  await prisma.agent.update({
    where: { id: agent.id },
    data: { emailVerifiedAt: new Date(), emailVerifyToken: null, emailVerifyExpiresAt: null },
  });

  const next = safeNext(url.searchParams.get('next'));
  const destination = agent.role === 'ADMIN' ? '/dashboard/admin' : next;

  const response = NextResponse.redirect(new URL(`${destination}${destination.includes('?') ? '&' : '?'}welcome=1`, request.url));
  setSessionCookie(response, agent.id);
  return response;
}
