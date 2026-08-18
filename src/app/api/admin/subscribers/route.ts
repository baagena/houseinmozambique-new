import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAgent } from '@/lib/admin-guard';
import { EMAIL_PATTERN, upsertSubscriber } from '@/lib/subscribers';

export async function GET() {
  const admin = await requireAdminAgent();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subscribers = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(
    subscribers.map((subscriber) => ({
      ...subscriber,
      createdAt: subscriber.createdAt.toISOString(),
      updatedAt: subscriber.updatedAt.toISOString(),
      lastEmailedAt: subscriber.lastEmailedAt?.toISOString() ?? null,
      unsubscribedAt: subscriber.unsubscribedAt?.toISOString() ?? null,
    }))
  );
}

/** Lets an admin add an address to the list by hand. */
export async function POST(request: Request) {
  const admin = await requireAdminAgent();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await request.json();
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const { subscriber, alreadySubscribed } = await upsertSubscriber(email, 'admin');

  return NextResponse.json({
    alreadySubscribed,
    subscriber: {
      ...subscriber,
      createdAt: subscriber.createdAt.toISOString(),
      updatedAt: subscriber.updatedAt.toISOString(),
      lastEmailedAt: subscriber.lastEmailedAt?.toISOString() ?? null,
      unsubscribedAt: subscriber.unsubscribedAt?.toISOString() ?? null,
    },
  });
}
