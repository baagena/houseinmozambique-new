/**
 * What an agent is allowed to publish, and why.
 *
 * Everything to do with quotas, plan periods and single-listing credits lives
 * here so there is exactly one answer to "may this person publish?". The
 * alternative — each caller counting listings its own way — is how a portal
 * ends up letting the wizard through and the mobile API refuse, or vice versa.
 *
 * THE RULES, in the order they are applied:
 *
 *   1. Admins are never metered. They post on behalf of the business.
 *   2. An AVAILABLE single-listing credit is spent before plan quota, because
 *      the agent paid cash for it and it does not renew — leaving it unspent
 *      while their subscription absorbs the listing is taking their money for
 *      nothing.
 *   3. Plan quota counts listings that are LIVE, not listings ever created.
 *   4. A subscription inside its grace window still grants everything.
 */
import { prisma } from '@/lib/db';
import { activateAddonsForPayment } from '@/lib/listing-addons';

/** Statuses that occupy a slot: live, or queued to go live. */
export const OCCUPYING_STATUSES = ['PUBLISHED', 'PENDING'] as const;

/** How long a lapsed subscription keeps working while renewal is chased. */
/*
 * Re-exported so every existing caller keeps working. The value lives in
 * listing-lifecycle.ts, which has no imports and is therefore safe to pull
 * into a client component — this module is not.
 */
export { GRACE_DAYS } from '@/lib/listing-lifecycle';
import { GRACE_DAYS } from '@/lib/listing-lifecycle';

export type EntitlementSource = 'admin' | 'credit' | 'subscription' | 'none';

export interface EntitlementState {
  /** The plan currently in force, if any. */
  planSlug: string | null;
  planName: string | null;
  /** -1 means unlimited. */
  quota: number;
  /** Listings occupying a slot right now. */
  used: number;
  /** null when unlimited. */
  remaining: number | null;
  /** Unspent single-listing credits. */
  credits: number;
  /** May they publish one more listing right now? */
  canPublish: boolean;
  /** What would pay for the next listing. */
  nextSource: EntitlementSource;
  subscriptionId: string | null;
  /** Set while a subscription is past its period but inside grace. */
  inGrace: boolean;
  periodEnd: Date | null;
}

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

/**
 * The subscription in force, or null.
 *
 * "In force" is deliberately not `status === 'ACTIVE'`: a period that ended
 * yesterday is still in force if its grace window has not closed, and the
 * status column is only corrected when something sweeps it. Reading the dates
 * rather than trusting the flag means a missed sweep cannot silently strip a
 * paying agency of its listings.
 */
export async function subscriptionInForce(agentId: string) {
  const now = new Date();
  const subs = await prisma.subscription.findMany({
    where: { agentId, status: { in: ['ACTIVE', 'GRACE'] } },
    orderBy: { currentPeriodEnd: 'desc' },
    include: { plan: true },
  });

  return subs.find((s) => {
    const until = s.graceUntil ?? s.currentPeriodEnd;
    return until >= now;
  }) ?? null;
}

/** Listings that currently occupy a slot. */
export function countOccupying(agentId: string) {
  return prisma.property.count({
    where: { hostId: agentId, status: { in: [...OCCUPYING_STATUSES] } },
  });
}

/** Unspent credits that have not passed their own expiry. */
export function countAvailableCredits(agentId: string) {
  return prisma.listingCredit.count({
    where: {
      agentId,
      status: 'AVAILABLE',
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
  });
}

/** Everything the dashboard, the wizard and the API need to decide and to explain. */
export async function getEntitlementState(
  agentId: string,
  role?: string | null,
): Promise<EntitlementState> {
  if (role === 'ADMIN') {
    return {
      planSlug: null, planName: 'Staff', quota: -1, used: await countOccupying(agentId),
      remaining: null, credits: 0, canPublish: true, nextSource: 'admin',
      subscriptionId: null, inGrace: false, periodEnd: null,
    };
  }

  const [sub, used, credits] = await Promise.all([
    subscriptionInForce(agentId),
    countOccupying(agentId),
    countAvailableCredits(agentId),
  ]);

  const quota = sub?.plan.listingQuota ?? 0;
  const unlimited = quota === -1;
  const remaining = unlimited ? null : Math.max(0, quota - used);
  const inGrace = Boolean(sub && sub.currentPeriodEnd < new Date());

  // A credit is spent first — see rule 2 at the top of this file.
  const nextSource: EntitlementSource = credits > 0
    ? 'credit'
    : unlimited || (remaining ?? 0) > 0 ? 'subscription' : 'none';

  return {
    planSlug: sub?.plan.slug ?? null,
    planName: sub?.plan.nameEn ?? null,
    quota,
    used,
    remaining,
    credits,
    canPublish: nextSource !== 'none',
    nextSource,
    subscriptionId: sub?.id ?? null,
    inGrace,
    periodEnd: sub?.currentPeriodEnd ?? null,
  };
}

/**
 * Gives a brand-new account the free plan, once.
 *
 * Lazy rather than at registration, so the accounts that already exist get one
 * the first time they are checked instead of needing a migration. It never
 * creates a second subscription and never overwrites a paid one.
 *
 * Existing listings are NOT counted against them retroactively: an agent with
 * five listings and a free plan keeps all five, and is simply told they are
 * over quota when they try to add a sixth. Unpublishing work somebody already
 * did, to enforce a rule that did not exist when they did it, is not something
 * a quota change gets to do.
 */
export async function ensureFreePlan(agentId: string) {
  const existing = await subscriptionInForce(agentId);
  if (existing) return existing;

  const free = await prisma.pricingPlan.findFirst({
    where: { isActive: true, kind: 'subscription', priceMinor: 0 },
    orderBy: { sortOrder: 'asc' },
  });
  if (!free) return null;

  return prisma.subscription.create({
    data: {
      agentId,
      planId: free.id,
      status: 'ACTIVE',
      // The free tier does not lapse. A far-future end keeps every read path
      // identical to a paid plan's rather than special-casing "free means null".
      currentPeriodEnd: daysFromNow(365 * 50),
      grantNote: 'Free tier, granted automatically',
    },
    include: { plan: true },
  });
}

export interface PublishDecision {
  ok: boolean;
  source: EntitlementSource;
  /** Attach to the Property being created. */
  subscriptionId?: string;
  listingCreditId?: string;
  publishedUntil?: Date;
  /** Why not, in words the agent can act on. */
  reason?: string;
  state: EntitlementState;
}

/**
 * Decides what pays for one new listing, without consuming anything.
 *
 * Split from the consume step because the wizard needs to ASK this on the way
 * in — to warn "this is your last listing" — long before anything is created,
 * and asking must never have a side effect.
 */
export async function planForNewListing(
  agentId: string,
  role?: string | null,
  /**
   * What is being listed, for the modest-rental exemption below. Optional, so
   * every existing caller keeps working and simply does not qualify.
   */
  listing?: { priceMinor?: number; listingType?: string | null },
): Promise<PublishDecision> {
  if (role !== 'ADMIN') await ensureFreePlan(agentId);
  const state = await getEntitlementState(agentId, role);

  if (state.nextSource === 'admin') return { ok: true, source: 'admin', state };

  if (state.nextSource === 'credit') {
    const credit = await prisma.listingCredit.findFirst({
      where: {
        agentId,
        status: 'AVAILABLE',
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      orderBy: { createdAt: 'asc' },
      include: { plan: true },
    });
    if (credit) {
      const days = credit.plan.durationDays ?? 60;
      return {
        ok: true,
        source: 'credit',
        listingCreditId: credit.id,
        publishedUntil: daysFromNow(days),
        state,
      };
    }
  }

  if (state.nextSource === 'subscription' && state.subscriptionId) {
    return { ok: true, source: 'subscription', subscriptionId: state.subscriptionId, state };
  }

  /*
   * THE MODEST-RENTAL EXEMPTION.
   *
   * Taken from houseinrwanda.com, whose free tier is defined by what the
   * property is worth rather than by a count: "a free property advertisement
   * is reserved for the individuals (property owners) renting out their
   * properties for less than 200,000 Rwf". That is a better-shaped free tier
   * than a quota. A quota turns away the person with one cheap flat exactly as
   * firmly as the agency with forty, when only one of those two was ever going
   * to pay.
   *
   * Three conditions, all of them load-bearing:
   *   · OWNER, not AGENT — an agency is a business and this is not for them;
   *   · a rental, not a sale — a sale earns a commission that can carry a fee;
   *   · under the threshold the admin sets.
   *
   * Off until somebody sets a figure. A threshold of zero means the exemption
   * does not exist, which is the correct default for a rule nobody has agreed
   * the number for yet.
   */
  if (
    role === 'OWNER'
    && listing?.priceMinor
    && (listing.listingType ?? '').toLowerCase().includes('rent')
  ) {
    const ceiling = await modestRentalCeilingMinor();
    if (ceiling > 0 && listing.priceMinor <= ceiling) {
      return { ok: true, source: 'subscription', subscriptionId: state.subscriptionId ?? undefined, state };
    }
  }

  return {
    ok: false,
    source: 'none',
    reason: state.planSlug
      ? `Your ${state.planName ?? state.planSlug} plan covers ${state.quota} live listing${state.quota === 1 ? '' : 's'} and you have ${state.used}. Upgrade, buy a single listing, or take one of your listings down to free a slot.`
      : 'You do not have a plan yet. Choose one to publish your first listing.',
    state,
  };
}

/**
 * The rent below which an owner may list for nothing, in centavos.
 *
 * An AppSetting rather than a constant because it is a commercial decision
 * that will be tuned, and tuning it should not need a deploy. Zero — the
 * default — switches the exemption off entirely.
 */
export async function modestRentalCeilingMinor(): Promise<number> {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: 'freeRentalCeilingMinor' },
      select: { value: true },
    });
    const n = Number.parseInt(row?.value ?? '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    // A settings lookup that fails must not hand out free listings.
    return 0;
  }
}

/** Marks a credit spent. Called inside the same transaction as the property create. */
export async function consumeCredit(creditId: string, propertyId: string) {
  await prisma.listingCredit.update({
    where: { id: creditId },
    data: { status: 'CONSUMED', consumedAt: new Date(), property: { connect: { id: propertyId } } },
  });
}

/**
 * Turns a settled payment into the thing it bought.
 *
 * Idempotent on purpose. Payment gateways retry webhooks, and M-Pesa callbacks
 * in particular can arrive more than once — granting a second month because a
 * network blipped would be the kind of bug nobody reports and everybody
 * exploits. Keyed on paymentId, which is unique per transaction.
 */
export async function grantFromPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== 'COMPLETED') return null;

  const already = await Promise.all([
    prisma.subscription.findFirst({ where: { paymentId } }),
    prisma.listingCredit.findFirst({ where: { paymentId } }),
  ]);
  if (already[0] || already[1]) return already[0] ?? already[1];

  const plan = payment.planId
    ? await prisma.pricingPlan.findUnique({ where: { id: payment.planId } })
    : await prisma.pricingPlan.findUnique({ where: { slug: payment.planType } });

  if (!plan) {
    console.error(`entitlements: payment ${paymentId} settled but plan "${payment.planType}" is unknown — nothing granted.`);
    return null;
  }

  /*
   * An ADD-ON buys a boost on one listing, not capacity.
   *
   * Handled before the one_off and subscription branches because it grants
   * neither a credit nor a period — the thing it buys already exists and is
   * simply switched on for a window.
   */
  if (plan.kind === 'addon') {
    const activated = await activateAddonsForPayment(paymentId);
    return activated > 0 ? { addonsActivated: activated } : null;
  }

  if (plan.kind === 'one_off') {
    return prisma.listingCredit.create({
      data: { agentId: payment.userId, planId: plan.id, paymentId, status: 'AVAILABLE' },
    });
  }

  const periodDays = plan.interval === 'year' ? 365 : 30;
  const current = await subscriptionInForce(payment.userId);

  // Renewing early extends from the end of the paid period, not from today, so
  // paying a week ahead does not throw that week away.
  if (current && current.plan.id === plan.id) {
    const base = current.currentPeriodEnd > new Date() ? current.currentPeriodEnd : new Date();
    return prisma.subscription.update({
      where: { id: current.id },
      data: {
        status: 'ACTIVE',
        currentPeriodEnd: new Date(base.getTime() + periodDays * 86_400_000),
        graceUntil: null,
        paymentId,
      },
    });
  }

  // Switching plans: the old one stops, the new one starts today.
  if (current) {
    await prisma.subscription.update({
      where: { id: current.id },
      data: { status: 'CANCELLED' },
    });
  }

  return prisma.subscription.create({
    data: {
      agentId: payment.userId,
      planId: plan.id,
      status: 'ACTIVE',
      currentPeriodEnd: daysFromNow(periodDays),
      paymentId,
    },
  });
}

/**
 * Grants a period by hand — bank transfer, cash, or an M-Pesa payment sent
 * straight to a number outside the gateway.
 *
 * Not an edge case here: a great deal of business settles this way, and an
 * admin who cannot record it will keep the real ledger in a spreadsheet. Takes
 * who granted it and why, so the row can be audited later.
 */
export async function grantManually(opts: {
  agentId: string;
  planSlug: string;
  grantedBy: string;
  note: string;
  months?: number;
}) {
  const plan = await prisma.pricingPlan.findUnique({ where: { slug: opts.planSlug } });
  if (!plan) throw new Error(`Unknown plan "${opts.planSlug}"`);

  if (plan.kind === 'one_off') {
    return prisma.listingCredit.create({
      data: {
        agentId: opts.agentId, planId: plan.id, status: 'AVAILABLE',
        grantedBy: opts.grantedBy, grantNote: opts.note,
      },
    });
  }

  const months = opts.months ?? 1;
  const days = (plan.interval === 'year' ? 365 : 30) * months;
  const current = await subscriptionInForce(opts.agentId);
  const base = current && current.currentPeriodEnd > new Date() ? current.currentPeriodEnd : new Date();

  if (current && current.plan.id === plan.id) {
    return prisma.subscription.update({
      where: { id: current.id },
      data: {
        status: 'ACTIVE',
        currentPeriodEnd: new Date(base.getTime() + days * 86_400_000),
        graceUntil: null,
        grantedBy: opts.grantedBy,
        grantNote: opts.note,
      },
    });
  }

  if (current) {
    await prisma.subscription.update({ where: { id: current.id }, data: { status: 'CANCELLED' } });
  }

  return prisma.subscription.create({
    data: {
      agentId: opts.agentId, planId: plan.id, status: 'ACTIVE',
      currentPeriodEnd: daysFromNow(days),
      grantedBy: opts.grantedBy, grantNote: opts.note,
    },
  });
}

/**
 * Moves lapsed subscriptions through grace and out of it.
 *
 * Returns what it changed so a scheduled run can be checked rather than
 * trusted. Does NOT unpublish anything — deciding a listing comes down is a
 * separate step with its own notification, and folding it in here would mean a
 * sweep could quietly empty the site.
 */
export async function sweepSubscriptions() {
  const now = new Date();

  const lapsing = await prisma.subscription.findMany({
    where: { status: 'ACTIVE', currentPeriodEnd: { lt: now } },
    select: { id: true },
  });
  if (lapsing.length) {
    await prisma.subscription.updateMany({
      where: { id: { in: lapsing.map((s) => s.id) } },
      data: { status: 'GRACE', graceUntil: daysFromNow(GRACE_DAYS) },
    });
  }

  const expired = await prisma.subscription.findMany({
    where: { status: 'GRACE', graceUntil: { lt: now } },
    select: { id: true },
  });
  if (expired.length) {
    await prisma.subscription.updateMany({
      where: { id: { in: expired.map((s) => s.id) } },
      data: { status: 'EXPIRED' },
    });
  }

  return { movedToGrace: lapsing.length, expired: expired.length };
}
