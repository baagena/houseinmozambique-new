import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { getPaymentInstructions, hasAnyDestination } from '@/lib/payment-instructions';
import AdminVerifyPaymentsClient, {
  type VerifyPayment,
} from '@/components/dashboard/AdminVerifyPaymentsClient';

export const dynamic = 'force-dynamic';

/**
 * The reconciliation inbox the payments ledger page said was missing.
 *
 * The ledger answers "what has the platform charged". This answers a different
 * question — "what is somebody waiting on me for" — and it needs the
 * provenance the ledger does not show: the code the payer typed, the number
 * they sent from, the screenshot, and the gap between what the plan costs and
 * what they say they sent.
 *
 * Ordered oldest-first. A queue sorted newest-first quietly starves the person
 * who has been waiting longest, which is exactly who is about to give up on
 * the platform.
 */
export default async function AdminVerifyPaymentsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/auth');

  const [rows, instructions, settledToday] = await Promise.all([
    prisma.payment.findMany({
      where: { status: { in: ['SUBMITTED', 'PENDING', 'REJECTED'] } },
      orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
      take: 200,
      select: {
        id: true, orderRef: true, amount: true, amountMinor: true, currency: true,
        method: true, planType: true, status: true, userId: true,
        customerName: true, customerEmail: true, customerPhone: true,
        payerReference: true, payerMsisdn: true, proofUrl: true, proofNote: true,
        transactionId: true, submittedAt: true, createdAt: true,
        reviewNote: true, reviewedBy: true, reviewedAt: true,
      },
    }),
    getPaymentInstructions(),
    prisma.payment.count({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  /*
   * The plan's current price, shown beside what the payer says they sent.
   *
   * Payment.amountMinor is the price at the moment the reference was issued,
   * which is the figure that should be collected. But an admin checking a
   * three-week-old reference against a plan whose price has since changed
   * needs to see both, or they will reject a correct payment for being
   * "wrong".
   */
  const planSlugs = Array.from(new Set(rows.map((r) => r.planType)));
  const plans = planSlugs.length
    ? await prisma.pricingPlan.findMany({
        where: { slug: { in: planSlugs } },
        select: { slug: true, nameEn: true, priceMinor: true, currency: true, kind: true },
      })
    : [];
  const planBySlug = new Map(plans.map((p) => [p.slug, p]));

  const payments: VerifyPayment[] = rows.map((p) => {
    const plan = planBySlug.get(p.planType);
    return {
      id: p.id,
      orderRef: p.orderRef,
      // Rows predating amountMinor fall back to the float rather than showing
      // a confident zero an admin might approve against.
      amountMinor: p.amountMinor || Math.round((p.amount ?? 0) * 100),
      currency: p.currency,
      method: p.method,
      planType: p.planType,
      planName: plan?.nameEn ?? null,
      planPriceMinor: plan?.priceMinor ?? null,
      planMissing: !plan,
      status: p.status,
      agentId: p.userId,
      customerName: p.customerName,
      customerEmail: p.customerEmail,
      customerPhone: p.customerPhone,
      payerReference: p.payerReference,
      payerMsisdn: p.payerMsisdn,
      proofUrl: p.proofUrl,
      proofNote: p.proofNote,
      transactionId: p.transactionId,
      submittedAt: p.submittedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      reviewNote: p.reviewNote,
      reviewedBy: p.reviewedBy,
      reviewedAt: p.reviewedAt?.toISOString() ?? null,
    };
  });

  return (
    <AdminVerifyPaymentsClient
      payments={payments}
      settledToday={settledToday}
      destinationConfigured={hasAnyDestination(instructions)}
    />
  );
}
