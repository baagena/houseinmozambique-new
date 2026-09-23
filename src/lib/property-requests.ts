/**
 * The demand side: buyers posting what they want, agents answering.
 *
 * The rules live here rather than in the routes because three different
 * callers need the same answers — the public form, the admin moderation
 * screen, and the agent board — and "who may see a request" is exactly the
 * kind of question that drifts apart when each screen decides for itself.
 */

import { prisma } from '@/lib/db';

/** How long a requirement stays useful. Two months, as their platform gives. */
export const REQUEST_DAYS = 60;

/**
 * Who gets a request pushed to them, and who has to come and look.
 *
 * This is the commercial point of the whole feature. An agent on a paid plan
 * is EMAILED a new requirement the moment it is approved; an agent on the free
 * tier sees the same requirement on their board, but a day later. It is the
 * same downgrade houseinrwanda.com applies to free adverts — visible, but not
 * first — and it makes a subscription worth renewing for a reason other than
 * listing slots.
 */
export const FREE_TIER_DELAY_HOURS = 24;

/** A short reference a person can read down a phone: "PR-4K7QX2". */
export function requestRef(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `PR-${out}`;
}

export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

/**
 * Agents who should be emailed when a request is approved.
 *
 * Paid plans only, and verified addresses only. Broadcasting to every account
 * on the platform would mean a requirement for a two-bedroom in Matola landing
 * in the inbox of somebody who registered once in 2024 and never returned —
 * which is how a useful feature becomes the thing people filter to spam.
 */
export async function agentsToNotify(city?: string): Promise<
  { id: string; name: string; email: string }[]
> {
  const now = new Date();

  const live = await prisma.subscription.findMany({
    where: {
      status: { in: ['ACTIVE', 'GRACE'] },
      plan: { priceMinor: { gt: 0 } },
      OR: [{ currentPeriodEnd: { gt: now } }, { graceUntil: { gt: now } }],
    },
    select: { agentId: true },
  });

  const ids = Array.from(new Set(live.map((s) => s.agentId)));
  if (ids.length === 0) return [];

  return prisma.agent.findMany({
    where: {
      id: { in: ids },
      emailVerifiedAt: { not: null },
      role: { in: ['AGENT', 'ADMIN'] },
      /*
       * A city match is a hint, not a filter. An agent in Maputo may well
       * cover Matola, and the cost of a request reaching somebody who cannot
       * help is far lower than the cost of a buyer getting no answer at all.
       * So `city` only sorts; it never excludes.
       */
    },
    select: { id: true, name: true, email: true, location: true },
    orderBy: { createdAt: 'asc' },
  }).then((rows) =>
    rows
      .sort((a, b) => {
        if (!city) return 0;
        const near = (loc: string | null) =>
          loc && loc.toLowerCase().includes(city.toLowerCase()) ? 0 : 1;
        return near(a.location) - near(b.location);
      })
      .map(({ id, name, email }) => ({ id, name, email })),
  );
}

/**
 * Whether this agent may see requests at full speed, or on the free tier's
 * delay. Mirrors the paid check above so the two can never disagree.
 */
export async function hasPaidPlan(agentId: string): Promise<boolean> {
  const now = new Date();
  const sub = await prisma.subscription.findFirst({
    where: {
      agentId,
      status: { in: ['ACTIVE', 'GRACE'] },
      plan: { priceMinor: { gt: 0 } },
      OR: [{ currentPeriodEnd: { gt: now } }, { graceUntil: { gt: now } }],
    },
    select: { id: true },
  });
  return Boolean(sub);
}

/**
 * The requests an agent is allowed to see right now.
 *
 * Open, unexpired, and — for a free-tier agent — held back for a day. The
 * delay is applied here rather than by a scheduled job so there is nothing to
 * run and nothing to go wrong: a request simply becomes visible once it is old
 * enough.
 */
export async function visibleRequests(agentId: string, paid: boolean) {
  const now = new Date();
  const cutoff = paid ? now : new Date(now.getTime() - FREE_TIER_DELAY_HOURS * 3_600_000);

  return prisma.propertyRequest.findMany({
    where: {
      status: { in: ['OPEN', 'MATCHED'] },
      createdAt: { lte: cutoff },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      responses: {
        select: { id: true, agentId: true, createdAt: true },
      },
    },
  });
}

/**
 * A request as an agent sees it.
 *
 * Contact details are stripped unless the agent has already responded — that
 * is what `anonymous` buys the buyer, and it has to be enforced where the data
 * is shaped rather than by remembering not to render a field.
 */
export function toAgentView(
  r: Awaited<ReturnType<typeof visibleRequests>>[number],
  agentId: string,
) {
  const mine = r.responses.find((x) => x.agentId === agentId);
  const revealed = !r.anonymous || Boolean(mine);

  return {
    id: r.id,
    ref: r.ref,
    intent: r.intent,
    propertyType: r.propertyType,
    city: r.city,
    areas: r.areas,
    budgetMinMinor: r.budgetMinMinor,
    budgetMaxMinor: r.budgetMaxMinor,
    currency: r.currency,
    minBeds: r.minBeds,
    minBaths: r.minBaths,
    moveBy: r.moveBy?.toISOString() ?? null,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt?.toISOString() ?? null,
    responseCount: r.responses.length,
    /** True once this agent has answered — which is what reveals the contact. */
    answered: Boolean(mine),
    anonymous: r.anonymous,
    name: revealed ? r.name : null,
    email: revealed ? r.email : null,
    phone: revealed ? r.phone : null,
  };
}

export type AgentRequestView = ReturnType<typeof toAgentView>;

/** Closes requests whose window has run out. Safe to call repeatedly. */
export async function sweepExpiredRequests(): Promise<number> {
  const { count } = await prisma.propertyRequest.updateMany({
    where: { status: { in: ['OPEN', 'MATCHED'] }, expiresAt: { lt: new Date() } },
    data: { status: 'CLOSED' },
  });
  return count;
}
