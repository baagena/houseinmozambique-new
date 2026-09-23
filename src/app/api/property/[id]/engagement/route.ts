import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * A buyer pressed a contact button on a listing.
 *
 * Every channel used to collapse into one `contactClicks` counter, so an agent
 * could see that twelve people tried to reach them and had no way to learn that
 * eleven of those were WhatsApp. Each press is now also written as a
 * ContactEvent carrying its channel, which is what the dashboard reads.
 *
 * `contactClicks` and `viewingClicks` keep incrementing exactly as before, so
 * the aggregates already on the admin screens do not change meaning.
 */
const CHANNELS = {
  whatsapp: 'WHATSAPP',
  call: 'CALL',
  email: 'EMAIL',
  form: 'FORM',
  contact: 'FORM',
  viewing: 'VIEWING',
} as const;

type EventName = keyof typeof CHANNELS;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { event } = await request.json();

    if (typeof event !== 'string' || !(event in CHANNELS)) {
      return NextResponse.json({ error: 'Invalid engagement event.' }, { status: 400 });
    }
    const channel = CHANNELS[event as EventName];

    const property = await prisma.property.findUnique({
      where: { id },
      select: { status: true, hostId: true },
    });
    if (!property || property.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    /*
     * Two separate writes, not a $transaction.
     *
     * Neon is reached through its pooler, which cannot always start a
     * transaction in time under concurrent presses — "Transaction API error:
     * Unable to start a transaction in the given time" lost roughly half the
     * events when two buttons were pressed together.
     *
     * The event row is the ledger and goes first. The counter is a convenience
     * aggregate that can be recomputed from these rows, so if it fails the
     * press is still recorded and the response is still a success: a buyer
     * reaching the agent must never depend on a statistic being written.
     */
    await prisma.contactEvent.create({
      data: { propertyId: id, agentId: property.hostId, channel },
    });

    try {
      await prisma.property.update({
        where: { id },
        data: channel === 'VIEWING'
          ? { viewingClicks: { increment: 1 } }
          : { contactClicks: { increment: 1 } },
      });
    } catch (error) {
      console.error('Engagement counter increment failed (event was recorded):', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Property engagement tracking failed:', error);
    return NextResponse.json({ error: 'Could not track engagement.' }, { status: 500 });
  }
}
