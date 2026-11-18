import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';

/**
 * The payment verification queue (web: dashboard/admin/payments/verify),
 * oldest first, with the plan's current price beside what was charged.
 * Approve / reject goes to the shared POST /api/admin/payments/:id/verify.
 */
export async function GET(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rows = await prisma.payment.findMany({
    where: { status: { in: ['SUBMITTED', 'PENDING', 'REJECTED'] } },
    orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
    take: 200,
    select: {
      id: true, orderRef: true, amount: true, amountMinor: true, currency: true,
      method: true, planType: true, status: true, userId: true,
      customerName: true, customerEmail: true, customerPhone: true,
      payerReference: true, payerMsisdn: true, proofUrl: true, proofNote: true,
      submittedAt: true, createdAt: true, reviewNote: true, reviewedBy: true,
    },
  });

  const slugs = Array.from(new Set(rows.map((r) => r.planType)));
  const plans = slugs.length
    ? await prisma.pricingPlan.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, nameEn: true, priceMinor: true },
      })
    : [];
  const planBySlug = new Map(plans.map((p) => [p.slug, p]));

  return NextResponse.json({
    payments: rows.map((p) => {
      const plan = planBySlug.get(p.planType);
      return {
        id: p.id,
        orderRef: p.orderRef,
        // Rows predating amountMinor fall back to the float rather than a zero.
        amountMinor: p.amountMinor || Math.round((p.amount ?? 0) * 100),
        currency: p.currency,
        method: p.method,
        planType: p.planType,
        planName: plan?.nameEn ?? null,
        planPriceMinor: plan?.priceMinor ?? null,
        status: p.status,
        agentId: p.userId,
        customerName: p.customerName,
        customerEmail: p.customerEmail,
        customerPhone: p.customerPhone,
        payerReference: p.payerReference,
        payerMsisdn: p.payerMsisdn,
        proofUrl: p.proofUrl,
        proofNote: p.proofNote,
        submittedAt: p.submittedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        reviewNote: p.reviewNote,
        reviewedBy: p.reviewedBy,
      };
    }),
  });
}
