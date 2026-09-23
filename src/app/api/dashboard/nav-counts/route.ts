/**
 * GET /api/dashboard/nav-counts — the badge numbers on the sidebar.
 *
 * The design reference shows a count against several nav rows (Approvals 8,
 * Leads 3, Subscribers 1.2k). Those are real figures, not decoration: the point
 * of the badge is that you can see there is work waiting without opening the
 * page. So they come from the database, and a zero means the badge is hidden
 * rather than showing a reassuring-looking "0".
 *
 * Scoped by role — an agent gets their own numbers, never the platform's.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPaidPlan, FREE_TIER_DELAY_HOURS } from '@/lib/property-requests';

/** Mirrors visibleRequests()' rule exactly, counting instead of selecting. */
async function countOpenRequests(agentId: string): Promise<number> {
  const now = new Date();
  const paid = await hasPaidPlan(agentId);
  const cutoff = paid ? now : new Date(now.getTime() - FREE_TIER_DELAY_HOURS * 3_600_000);

  return prisma.propertyRequest.count({
    where: {
      status: { in: ['OPEN', 'MATCHED'] },
      createdAt: { lte: cutoff },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      responses: { none: { agentId } },
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export type NavCounts = Partial<Record<
  | 'properties'
  | 'approvals'
  | 'messages'
  | 'subscribers'
  | 'payments'
  | 'paymentsToVerify'
  | 'requestsToRelease'
  | 'openRequests'
  | 'myListings'
  | 'myLeads',
  number
>>;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    if (session.role === 'ADMIN') {
      // One round trip rather than five: the database is ~255 ms away.
      const [properties, approvals, messages, subscribers, payments, paymentsToVerify] =
        await Promise.all([
          prisma.property.count(),
          prisma.property.count({ where: { status: 'PENDING' } }),
          prisma.inquiry.count({ where: { isRead: false } }),
          prisma.subscriber.count({ where: { isActive: true } }),
          prisma.payment.count({ where: { status: { in: ['PENDING', 'SUBMITTED'] } } }),
          /* SUBMITTED only. A PENDING reference is a payer who has not sent
             anything yet — badging it would show permanent unread work an
             admin cannot clear, and the badge stops meaning anything. */
          prisma.payment.count({ where: { status: 'SUBMITTED' } }),
        ]);
      const requestsToRelease = await prisma.propertyRequest.count({ where: { status: 'PENDING' } });
      return NextResponse.json({
        counts: {
          properties, approvals, messages, subscribers, payments, paymentsToVerify,
          requestsToRelease,
        } satisfies NavCounts,
      });
    }

    const [myListings, myLeads, openRequests] = await Promise.all([
      prisma.property.count({ where: { hostId: session.id } }),
      prisma.inquiry.count({ where: { agentId: session.id, isRead: false } }),
      /*
       * Requests this agent has not answered AND can actually open.
       *
       * The badge has to obey the free tier's delay or it advertises work that
       * is not there: a free-tier agent saw "1", clicked through, and found an
       * empty board. A count and the page it points at have to agree.
       */
      countOpenRequests(session.id),
    ]);
    return NextResponse.json({ counts: { myListings, myLeads, openRequests } satisfies NavCounts });
  } catch (error) {
    console.error('nav-counts failed:', error);
    // A failed count must never break the shell — the nav renders without badges.
    return NextResponse.json({ counts: {} satisfies NavCounts });
  }
}
