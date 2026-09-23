import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { getEntitlementState, GRACE_DAYS } from '@/lib/entitlements';
import { getPaymentInstructions, hasAnyDestination } from '@/lib/payment-instructions';
import AgentBillingClient from '@/components/dashboard/AgentBillingClient';

export const dynamic = 'force-dynamic';

/**
 * What the agent is paying, what they get for it, and what is due next.
 *
 * Everything on this page was previously invisible to the person paying for it:
 * the payments table existed but only an admin could see it, and what a plan
 * actually granted was not recorded anywhere. An agent could not answer "how
 * many listings do I have left" or "when does this run out" without asking.
 */
export default async function AgentBillingPage() {
  const session = await getSession();
  if (!session) redirect('/auth');

  const [state, subscription, payments, plans, credits, instructions] = await Promise.all([
    getEntitlementState(session.id, session.role),
    prisma.subscription.findFirst({
      where: { agentId: session.id, status: { in: ['ACTIVE', 'GRACE'] } },
      orderBy: { currentPeriodEnd: 'desc' },
      include: { plan: true },
    }),
    prisma.payment.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, orderRef: true, amountMinor: true, amount: true, currency: true,
        method: true, planType: true, status: true, createdAt: true, completedAt: true,
        payerReference: true, payerMsisdn: true, proofUrl: true, proofNote: true,
        submittedAt: true, reviewNote: true, reviewedAt: true,
      },
    }),
    prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.listingCredit.findMany({
      where: { agentId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { plan: { select: { nameEn: true, namePt: true } } },
    }),
    getPaymentInstructions(),
  ]);

  /*
   * The one payment that still needs something from the agent.
   *
   * PENDING means a reference was issued and nothing has been sent yet;
   * REJECTED means what they sent did not match. Both want the same panel — the
   * destination accounts and the proof form — so they are one case here.
   * SUBMITTED is shown too, but as a receipt rather than a form: the ball is
   * with the team, and offering them the form again invites a duplicate
   * payment.
   */
  /*
   * A reference only counts as open if the agent still owes it.
   *
   * Two things make one stale. It may have been cancelled outright when a
   * sibling settled. Or it may predate a payment that has since been
   * confirmed for the same plan — the agent paid, an admin approved it, and
   * this row is the leftover of an earlier attempt. Showing either one keeps
   * asking a paid-up agent for money, which is what it was doing.
   */
  const settledPlanAt = new Map<string, number>();
  for (const p of payments) {
    if (p.status === 'COMPLETED') {
      const at = (p.completedAt ?? p.createdAt).getTime();
      settledPlanAt.set(p.planType, Math.max(settledPlanAt.get(p.planType) ?? 0, at));
    }
  }
  /*
   * A paid plan taken out AFTER a reference was raised kills it too, even for a
   * different plan: an agent who asked for Standard, changed their mind and
   * bought Premium does not still owe for Standard. The free tier cannot
   * trigger this — it is granted at registration, so it always predates any
   * reference the agent later raised.
   */
  const paidSubStartedAt =
    subscription && subscription.plan.priceMinor > 0 ? subscription.startedAt.getTime() : 0;

  const stillOwed = (p: (typeof payments)[number]) =>
    p.status !== 'CANCELLED'
    && (settledPlanAt.get(p.planType) ?? 0) < p.createdAt.getTime()
    && paidSubStartedAt < p.createdAt.getTime();

  const openPayment = payments.find((p) => (p.status === 'PENDING' || p.status === 'REJECTED') && stillOwed(p))
    ?? payments.find((p) => p.status === 'SUBMITTED')
    ?? null;

  const openPaymentPlan = openPayment
    ? plans.find((pl) => pl.slug === openPayment.planType)
    : undefined;

  return (
    <AgentBillingClient
      state={state}
      graceDays={GRACE_DAYS}
      subscription={subscription && {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        graceUntil: subscription.graceUntil?.toISOString() ?? null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        grantNote: subscription.grantNote,
        planSlug: subscription.plan.slug,
        planNameEn: subscription.plan.nameEn,
        planNamePt: subscription.plan.namePt,
        priceMinor: subscription.plan.priceMinor,
        currency: subscription.plan.currency,
        interval: subscription.plan.interval,
      }}
      instructions={instructions}
      destinationConfigured={hasAnyDestination(instructions)}
      openPayment={openPayment && {
        id: openPayment.id,
        orderRef: openPayment.orderRef,
        amountMinor: openPayment.amountMinor || Math.round((openPayment.amount ?? 0) * 100),
        currency: openPayment.currency,
        planType: openPayment.planType,
        /* The plan's display name, so the card can say "Premium" rather than
           the slug. null when the plan has since been removed — the card then
           falls back to the slug rather than showing an empty chip. */
        planName: openPaymentPlan?.nameEn ?? null,
        status: openPayment.status,
        payerReference: openPayment.payerReference,
        payerMsisdn: openPayment.payerMsisdn,
        proofUrl: openPayment.proofUrl,
        proofNote: openPayment.proofNote,
        submittedAt: openPayment.submittedAt?.toISOString() ?? null,
        reviewNote: openPayment.reviewNote,
        createdAt: openPayment.createdAt.toISOString(),
      }}
      payments={payments.map((p) => ({
        id: p.id,
        orderRef: p.orderRef,
        /* The plan's name, not its slug. The history row showed "Flowtest-
           Monthly" — a title-cased database key, which is not what the agent
           was sold. Falls back to the slug for a plan that no longer exists. */
        planName: plans.find((pl) => pl.slug === p.planType)?.namePt ?? null,
        planNameEn: plans.find((pl) => pl.slug === p.planType)?.nameEn ?? null,
        // Older rows predate amountMinor; fall back to the float they were
        // recorded with rather than showing a confident zero.
        amountMinor: p.amountMinor || Math.round((p.amount ?? 0) * 100),
        currency: p.currency,
        method: p.method,
        planType: p.planType,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        completedAt: p.completedAt?.toISOString() ?? null,
        reviewNote: p.reviewNote,
      }))}
      plans={plans.map((p) => ({
        slug: p.slug,
        kind: p.kind,
        nameEn: p.nameEn,
        namePt: p.namePt,
        descriptionEn: p.descriptionEn,
        descriptionPt: p.descriptionPt,
        priceMinor: p.priceMinor,
        currency: p.currency,
        interval: p.interval,
        listingQuota: p.listingQuota,
        featuredQuota: p.featuredQuota,
        durationDays: p.durationDays,
        highlighted: p.highlighted,
      }))}
      credits={credits.map((c) => ({
        id: c.id,
        status: c.status,
        planName: c.plan.nameEn,
        createdAt: c.createdAt.toISOString(),
        consumedAt: c.consumedAt?.toISOString() ?? null,
        expiresAt: c.expiresAt?.toISOString() ?? null,
      }))}
    />
  );
}
