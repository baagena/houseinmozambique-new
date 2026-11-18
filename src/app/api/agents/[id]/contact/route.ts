import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { CONTACT_CHANNELS, type ContactChannelKey } from '@/lib/agent-contact-links';

/**
 * Someone pressed a contact button on an agent's profile (website or app):
 * WhatsApp, call, email, website or a social network.
 *
 * Recorded as a ContactEvent with no listing, so it shows in the agent's
 * "how people reached you" figures next to listing contacts. Corporate agents
 * often have no listings, and this is the only way their contacts are seen.
 *
 * Public on purpose (visitors are usually signed out) and never blocks the
 * visitor: the page opens the link whatever this returns.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let channelKey: unknown;
    try {
      ({ channel: channelKey } = await request.json());
    } catch {
      // sendBeacon from the website may send text/plain; parse it ourselves.
      channelKey = undefined;
    }
    if (typeof channelKey !== 'string' || !(channelKey in CONTACT_CHANNELS)) {
      return NextResponse.json({ error: 'Invalid contact channel.' }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!agent || agent.role === 'REVOKED') {
      return NextResponse.json({ error: 'Agent not found.' }, { status: 404 });
    }

    // An agent checking their own buttons is not a lead.
    const session = await getSession().catch(() => null);
    if (session?.id === agent.id) return NextResponse.json({ success: true, counted: false });

    await prisma.contactEvent.create({
      data: { agentId: agent.id, propertyId: null, channel: CONTACT_CHANNELS[channelKey as ContactChannelKey] },
    });
    return NextResponse.json({ success: true, counted: true });
  } catch (error) {
    console.error('Agent profile contact tracking failed:', error);
    return NextResponse.json({ error: 'Could not record the contact.' }, { status: 500 });
  }
}
