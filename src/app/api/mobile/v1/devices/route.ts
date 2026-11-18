import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAgent } from '@/lib/mobile-auth';

/**
 * The phone a signed-in agent or admin wants push notifications on.
 *
 * POST registers (or moves) a Firebase token to the caller; DELETE removes it,
 * which the app does on sign-out and when notifications are switched off.
 * Customers do not get pushes today, so their tokens are refused rather than
 * stored for nothing.
 */

function readToken(body: unknown): string | null {
  const token = body && typeof body === 'object' ? (body as Record<string, unknown>).token : null;
  return typeof token === 'string' && token.length >= 20 && token.length <= 4096 ? token : null;
}

export async function POST(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  // Accounts that list property — owners too (their listing approved/rejected).
  if (auth.agent.role !== 'AGENT' && auth.agent.role !== 'ADMIN' && auth.agent.role !== 'OWNER') {
    return NextResponse.json({ error: 'Notifications are for accounts that list property.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const token = readToken(body);
  if (!token) return NextResponse.json({ error: 'A device token is required.' }, { status: 400 });

  const b = body as Record<string, unknown>;
  const platform = b.platform === 'ios' ? 'ios' : 'android';
  const lang = b.lang === 'en' ? 'en' : 'pt';
  const appVersion = typeof b.appVersion === 'string' ? b.appVersion.slice(0, 32) : null;

  await prisma.pushDevice.upsert({
    where: { token },
    create: { token, agentId: auth.agent.id, platform, lang, appVersion },
    update: { agentId: auth.agent.id, platform, lang, appVersion },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const token = readToken(await request.json().catch(() => null));
  if (!token) return NextResponse.json({ error: 'A device token is required.' }, { status: 400 });

  // Scoped to the caller: nobody can switch off someone else's phone.
  await prisma.pushDevice.deleteMany({ where: { token, agentId: auth.agent.id } });
  return NextResponse.json({ success: true });
}
