import { cache } from 'react';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * The single source of truth for web session identity.
 *
 * The previous mechanism stored the agent's raw Prisma primary key in an
 * unsigned `userId` cookie. Because seeded ids are guessable (the seeded admin
 * is literally `admin-1`), sending `Cookie: userId=admin-1` was enough to be
 * admin on every endpoint with no password involved. That is why the cookie
 * name changed: an old `userId` cookie is now simply ignored, so the forged
 * value stops working rather than being quietly honoured.
 *
 * The token carries only a subject claim. The role is deliberately NOT read
 * from the payload — it is loaded from the database on every request, so a
 * revoked or demoted agent loses access immediately instead of when their
 * token happens to expire.
 */

export const SESSION_COOKIE = 'him_session';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matching the old cookie

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET (or JWT_SECRET) is not set. Web sessions cannot be signed or verified.'
    );
  }
  return secret;
}

interface SessionPayload {
  sub: string;
}

export function createSessionToken(agentId: string): string {
  return jwt.sign({ sub: agentId } satisfies SessionPayload, getSecret(), {
    expiresIn: SESSION_MAX_AGE_SECONDS,
  });
}

function verifySessionToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, getSecret()) as SessionPayload;
    return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
  } catch {
    // Expired, tampered with, or signed by a different secret.
    return null;
  }
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
} as const;

/** Attaches a freshly signed session cookie to an outgoing response. */
export function setSessionCookie(response: NextResponse, agentId: string): void {
  response.cookies.set(SESSION_COOKIE, createSessionToken(agentId), {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clears the session cookie, and also clears the legacy `userId` cookie so a
 * browser still holding one from before this change does not keep sending it.
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
  response.cookies.set('userId', '', { ...COOKIE_OPTIONS, maxAge: 0 });
}

/** The fields every guard returns. Never widen this to include secrets. */
const SESSION_SELECT = {
  id: true,
  name: true,
  initials: true,
  email: true,
  role: true,
} as const;

export type SessionAgent = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: string;
};

/**
 * Resolves the signed-in agent, or null. Safe to call from Server Components
 * and route handlers alike.
 */
export const getSession = cache(async function getSession(): Promise<SessionAgent | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const agentId = verifySessionToken(token);
  if (!agentId) return null;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: SESSION_SELECT,
  });

  if (!agent) return null;
  if (agent.role === 'REVOKED') return null;

  return agent;
});

/** Resolves the signed-in agent only if they are an admin, else null. */
export async function requireAdmin(): Promise<SessionAgent | null> {
  const agent = await getSession();
  return agent?.role === 'ADMIN' ? agent : null;
}

/** Resolves any signed-in, non-revoked agent, else null. */
export async function requireAgent(): Promise<SessionAgent | null> {
  return await getSession();
}
