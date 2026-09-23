import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { GRACE_DAYS } from '@/lib/entitlements';
import AdminPaymentsClient from '@/components/dashboard/AdminPaymentsClient';
import {
  PAGE_SIZE,
  type AdminPayment,
  type FreeAgentRow,
  type PaymentFilter,
} from '@/lib/payments-view';
import { OCCUPYING_STATUSES } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

/**
 * Every payment, searchable, with what it bought and when that runs out.
 *
 * The table used to answer only "did this settle". The question actually asked
 * of it is "what is this person's situation" — which needs the payer beside
 * their payment, the period it paid for, and whether that period is still
 * running. So each row now carries the entitlement the payment produced.
 *
 * Payment holds no expiry date; the Subscription or ListingCredit it granted
 * does. They are joined here by `paymentId` rather than denormalised onto
 * Payment, because a period can be extended after the fact — by an early
 * renewal or an admin grant — and a copied date would then be quietly wrong.
 *
 * Read-only. This is the record you check a dispute against, so nothing on it
 * can be changed from it; settling happens in the verify queue.
 */

const FILTER_WHERE: Record<PaymentFilter, object> = {
  all: {},
  // Everything still waiting on somebody: the payer to send it, or us to check
  // it. Both belong under one pill because both mean "not finished".
  pending: { status: { in: ['PENDING', 'SUBMITTED'] } },
  // Active and expired are properties of the entitlement, not the payment, so
  // they are narrowed to settled rows here and split after the join below.
  active: { status: 'COMPLETED' },
  expired: { status: 'COMPLETED' },
  // Never used: 'free' does not select payments at all.
  free: {},
};

/**
 * Everyone using the platform without paying for it, and what they have.
 *
 * "Not paying" is defined the same way the publish check defines "paying":
 * no in-force subscription on a plan that costs something, and no unspent
 * listing credit. Deriving it rather than storing a flag means an account that
 * lapses or is comped moves in and out of this list on its own.
 */
async function loadFreeAgents(hueOf: (slug: string) => number): Promise<FreeAgentRow[]> {
  const now = new Date();

  const [paidSubs, liveCredits] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'GRACE'] },
        plan: { priceMinor: { gt: 0 } },
        OR: [{ currentPeriodEnd: { gt: now } }, { graceUntil: { gt: now } }],
      },
      select: { agentId: true },
    }),
    prisma.listingCredit.findMany({ where: { status: 'AVAILABLE' }, select: { agentId: true } }),
  ]);

  const paying = new Set([
    ...paidSubs.map((s) => s.agentId),
    ...liveCredits.map((c) => c.agentId),
  ]);

  const agents = await prisma.agent.findMany({
    where: {
      role: { in: ['AGENT', 'CUSTOMER'] },
      id: { notIn: paying.size ? [...paying] : ['__none__'] },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, phone: true, createdAt: true,
      subscriptions: {
        where: { status: { in: ['ACTIVE', 'GRACE'] } },
        orderBy: { currentPeriodEnd: 'desc' },
        take: 1,
        select: {
          currentPeriodEnd: true, grantedBy: true, grantNote: true,
          plan: { select: { slug: true, nameEn: true, listingQuota: true } },
        },
      },
    },
  });

  // Listings in one grouped query rather than one per agent.
  const used = await prisma.property.groupBy({
    by: ['hostId'],
    where: { hostId: { in: agents.map((a) => a.id) }, status: { in: [...OCCUPYING_STATUSES] } },
    _count: { _all: true },
  });
  const usedByAgent = new Map(used.map((u) => [u.hostId, u._count._all]));

  /* The free tier is written with a 50-year end date so every read path can
     treat it like a paid plan. Reporting that as an expiry date would be
     absurd, so anything more than five years out is shown as no end date. */
  const FAR_FUTURE = Date.now() + 5 * 365 * 86_400_000;

  return agents.map((a) => {
    const sub = a.subscriptions[0];
    const ends = sub?.currentPeriodEnd ?? null;
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      planName: sub?.plan.nameEn ?? null,
      planHue: sub ? hueOf(sub.plan.slug) : 0,
      listingQuota: sub?.plan.listingQuota ?? 0,
      listingsUsed: usedByAgent.get(a.id) ?? 0,
      comped: Boolean(sub?.grantedBy),
      grantedBy: sub?.grantedBy ?? null,
      grantNote: sub?.grantNote ?? null,
      endsAt: ends && ends.getTime() < FAR_FUTURE ? ends.toISOString() : null,
      joinedAt: a.createdAt.toISOString(),
    };
  });
}

/** What the joined queries hand back, narrowed to what a row needs. */
type SubRow = { status: string; currentPeriodEnd: Date; graceUntil: Date | null };
type CreditRow = { status: string; expiresAt: Date | null };
type PlanRow = { slug: string; nameEn: string; kind: string; interval: string | null; hue: number };
type PaymentRow = {
  id: string; orderRef: string; amount: number; amountMinor: number; currency: string;
  method: string; planType: string; status: string; userId: string;
  customerName: string; customerEmail: string; customerPhone: string | null;
  payerReference: string | null; payerMsisdn: string | null; proofUrl: string | null;
  transactionId: string | null; reviewedBy: string | null;
  submittedAt: Date | null; completedAt: Date | null; createdAt: Date;
};

/**
 * Turns payments plus the entitlements they bought into table rows.
 *
 * Module scope rather than inline in the page, because it reads the clock:
 * "is this still running" is a question about the moment the request arrives,
 * which is request-time work and does not belong in a component body.
 */
function buildRows(
  rowsRaw: PaymentRow[],
  subByPayment: Map<string, SubRow>,
  creditByPayment: Map<string, CreditRow>,
  planBySlug: Map<string, PlanRow>,
): AdminPayment[] {
  const now = Date.now();

  return rowsRaw.map((p) => {
    const sub = subByPayment.get(p.id);
    const credit = creditByPayment.get(p.id);

    /*
     * The date the entitlement runs out. For a subscription that is the end of
     * the grace window when one is open, because listings stay live through
     * grace — showing the period end would tell an admin a paying customer is
     * already off the site.
     *
     * An unconsumed credit has no end date yet: its window is computed from
     * the plan when it is spent, so there is genuinely nothing to show rather
     * than a date to invent.
     */
    const expiresAt = sub ? (sub.graceUntil ?? sub.currentPeriodEnd) : credit?.expiresAt ?? null;

    const granted = Boolean(sub || credit);
    const live = expiresAt
      ? expiresAt.getTime() > now
      : Boolean(credit && credit.status === 'AVAILABLE');

    const plan = planBySlug.get(p.planType);

    return {
      id: p.id,
      orderRef: p.orderRef,
      amountMinor: p.amountMinor || Math.round((p.amount ?? 0) * 100),
      currency: p.currency,
      method: p.method,
      planSlug: p.planType,
      planName: plan?.nameEn ?? p.planType,
      planKind: plan?.kind ?? 'subscription',
      planInterval: plan?.interval ?? null,
      planHue: plan?.hue ?? 0,
      status: p.status,
      agentId: p.userId,
      customerName: p.customerName,
      customerEmail: p.customerEmail,
      customerPhone: p.customerPhone || p.payerMsisdn,
      payerReference: p.payerReference ?? p.transactionId,
      hasProof: Boolean(p.proofUrl || p.payerReference),
      reviewedBy: p.reviewedBy,
      granted,
      live,
      paidAt: (p.completedAt ?? p.submittedAt ?? p.createdAt).toISOString(),
      settled: Boolean(p.completedAt),
      expiresAt: expiresAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    };
  });
}

/** Counts for the headline tiles, which are of the whole ledger. */
function countLive(
  subs: { currentPeriodEnd: Date; graceUntil: Date | null }[],
  credits: { status: string; expiresAt: Date | null }[],
): number {
  const now = Date.now();
  return (
    subs.filter((s) => (s.graceUntil ?? s.currentPeriodEnd).getTime() > now).length +
    credits.filter((c) => (c.expiresAt ? c.expiresAt.getTime() > now : c.status === 'AVAILABLE')).length
  );
}

export default async function AdminPaymentsPage(props: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect('/auth');

  const sp = await props.searchParams;
  const q = (sp.q ?? '').trim();
  const filter: PaymentFilter =
    sp.filter === 'pending' || sp.filter === 'active' ||
    sp.filter === 'expired' || sp.filter === 'free'
      ? sp.filter
      : 'all';
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  /*
   * Search covers the four things somebody arrives holding: a reference from a
   * receipt, a name, an email, or the phone number that rang them. `orderRef`
   * and `payerReference` are both searched because the payer quotes their own
   * confirmation code far more often than ours.
   */
  const search = q
    ? {
        OR: [
          { orderRef: { contains: q, mode: 'insensitive' as const } },
          { payerReference: { contains: q, mode: 'insensitive' as const } },
          { transactionId: { contains: q, mode: 'insensitive' as const } },
          { customerName: { contains: q, mode: 'insensitive' as const } },
          { customerEmail: { contains: q, mode: 'insensitive' as const } },
          { customerPhone: { contains: q } },
          { payerMsisdn: { contains: q } },
        ],
      }
    : {};

  const where = { ...FILTER_WHERE[filter], ...search };

  const select = {
    id: true, orderRef: true, amount: true, amountMinor: true, currency: true,
    method: true, planType: true, status: true, userId: true,
    customerName: true, customerEmail: true, customerPhone: true,
    payerReference: true, payerMsisdn: true, proofUrl: true, transactionId: true,
    reviewedBy: true, submittedAt: true, completedAt: true, createdAt: true,
  };

  /*
   * Active and expired cannot be paged in the database: whether a row belongs
   * in either depends on the joined entitlement's end date. Those two filters
   * therefore load the settled rows, classify them, and page in memory. The
   * set is bounded — a settled payment per period per agent — and the
   * alternative is a denormalised end date on Payment that goes stale.
   */
  const isFreeView = filter === 'free';
  const needsPostFilter = filter === 'active' || filter === 'expired';
  const take: number = needsPostFilter ? 500 : PAGE_SIZE;
  const skip: number = needsPostFilter ? 0 : (page - 1) * PAGE_SIZE;

  const [rowsRaw, totalAll, statusCounts, revenue] = await Promise.all([
    prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select }),
    prisma.payment.count({ where }),
    prisma.payment.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amountMinor: true } }),
  ]);

  // The entitlements these payments bought, in two round trips rather than one
  // per row.
  const paymentIds = rowsRaw.map((r) => r.id);
  const [subs, credits, plans] = await Promise.all([
    paymentIds.length
      ? prisma.subscription.findMany({
          where: { paymentId: { in: paymentIds } },
          select: { paymentId: true, status: true, currentPeriodEnd: true, graceUntil: true },
        })
      : [],
    paymentIds.length
      ? prisma.listingCredit.findMany({
          where: { paymentId: { in: paymentIds } },
          select: { paymentId: true, status: true, expiresAt: true },
        })
      : [],
    prisma.pricingPlan.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, nameEn: true, kind: true, interval: true },
    }),
  ]);

  const subByPayment = new Map(subs.map((s) => [s.paymentId!, s]));
  const creditByPayment = new Map(credits.map((c) => [c.paymentId!, c]));
  /* Colours spaced evenly around the wheel, in the plans' own display order,
     so the cheapest plan is not a near-neighbour of the dearest one. */
  const planBySlug = new Map(
    plans.map((p, i) => [p.slug, { ...p, hue: Math.round((i * 360) / Math.max(1, plans.length)) }]),
  );

  let rows: AdminPayment[] = buildRows(rowsRaw, subByPayment, creditByPayment, planBySlug);

  if (needsPostFilter) {
    rows = rows.filter((r) => (filter === 'active' ? r.live : r.granted && !r.live));
  }

  /* Loaded on every render, because the pill carries the count even when
     another view is showing. Two grouped queries, not a per-agent fan-out. */
  const freeAll = await loadFreeAgents((slug) => planBySlug.get(slug)?.hue ?? 0);

  const total = isFreeView ? freeAll.length : needsPostFilter ? rows.length : totalAll;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const window = <T,>(list: T[]) => list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Only the two in-memory views need slicing; the rest were paged by the
  // database.
  const visible = needsPostFilter ? window(rows) : rows;
  const freeVisible = isFreeView ? window(freeAll) : [];

  /*
   * The headline counts are of the whole ledger, never of the current filter.
   * A tile that changes when you click a pill stops being a fact about the
   * business and becomes a restatement of the filter you just chose.
   */
  const settledForCounts = await prisma.payment.findMany({
    where: { status: 'COMPLETED' },
    select: { id: true },
  });
  const settledIds = settledForCounts.map((s) => s.id);
  const [allSubs, allCredits] = await Promise.all([
    settledIds.length
      ? prisma.subscription.findMany({
          where: { paymentId: { in: settledIds } },
          select: { currentPeriodEnd: true, graceUntil: true },
        })
      : [],
    settledIds.length
      ? prisma.listingCredit.findMany({
          where: { paymentId: { in: settledIds } },
          select: { status: true, expiresAt: true },
        })
      : [],
  ]);

  const activeCount = countLive(allSubs, allCredits);
  const expiredCount = allSubs.length + allCredits.length - activeCount;

  const countOf = (s: string) => statusCounts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <AdminPaymentsClient
      payments={isFreeView ? [] : visible}
      freeAgents={freeVisible}
      query={q}
      filter={filter}
      page={safePage}
      pageCount={pageCount}
      total={total}
      graceDays={GRACE_DAYS}
      stats={{
        payments: statusCounts.reduce((sum, c) => sum + c._count._all, 0),
        active: activeCount,
        expired: expiredCount,
        revenueMinor: revenue._sum.amountMinor ?? 0,
        pending: countOf('PENDING') + countOf('SUBMITTED'),
        awaitingReview: countOf('SUBMITTED'),
        free: freeAll.length,
      }}
    />
  );
}
