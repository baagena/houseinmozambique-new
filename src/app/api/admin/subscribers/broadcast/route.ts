import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSubscriberBroadcastEmail } from '@/lib/email';
import { requireAdminAgent } from '@/lib/admin-guard';
import { unsubscribeUrl } from '@/lib/subscribers';

/** How many sends run at once — keeps the provider happy on larger lists. */
const BATCH_SIZE = 10;

/**
 * Sends one notification to every active subscriber. Each recipient gets their
 * own email, so no address is ever exposed to another subscriber.
 */
export async function POST(request: Request) {
  const admin = await requireAdminAgent();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await request.json();
  const subject = typeof payload.subject === 'string' ? payload.subject.trim() : '';
  const body = typeof payload.body === 'string' ? payload.body.trim() : '';

  if (!subject) {
    return NextResponse.json({ error: 'Give the email a subject line.' }, { status: 400 });
  }
  if (!body) {
    return NextResponse.json({ error: 'Write the message before sending.' }, { status: 400 });
  }

  const recipients = await prisma.subscriber.findMany({
    where: { isActive: true },
    select: { id: true, email: true },
  });

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'There are no active subscribers to send to.' }, { status: 400 });
  }

  const sentIds: string[] = [];
  const failed: { email: string; error: string }[] = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((recipient) =>
        sendSubscriberBroadcastEmail({
          to: recipient.email,
          subject,
          body,
          unsubscribeUrl: unsubscribeUrl(recipient.id),
        })
      )
    );

    results.forEach((result, index) => {
      const recipient = batch[index];
      if (result.status === 'fulfilled') {
        sentIds.push(recipient.id);
      } else {
        const reason = result.reason;
        failed.push({
          email: recipient.email,
          error: reason instanceof Error ? reason.message : String(reason),
        });
      }
    });
  }

  if (sentIds.length > 0) {
    await prisma.subscriber.updateMany({
      where: { id: { in: sentIds } },
      data: { lastEmailedAt: new Date() },
    });
  }

  if (sentIds.length === 0) {
    return NextResponse.json(
      {
        error: `The notification could not be sent. ${failed[0]?.error ?? ''}`.trim(),
        sent: 0,
        failed,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    sent: sentIds.length,
    total: recipients.length,
    failed,
  });
}
