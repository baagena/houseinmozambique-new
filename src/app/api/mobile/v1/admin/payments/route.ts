import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';

const STATUS_FILTER: Record<string, object> = {
  all: {},
  pending: { status: { in: ['PENDING', 'SUBMITTED'] } },
  completed: { status: 'COMPLETED' },
  rejected: { status: { in: ['REJECTED', 'FAILED', 'CANCELLED'] } },
};

/**
 * The payments ledger (web: dashboard/admin/payments): every payment, newest
 * first, filterable by status and searchable by reference, name or email.
 * Read-only — settling happens in the verify queue.
 */
export async function GET(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const filter = STATUS_FILTER[url.searchParams.get('status') ?? 'all'] ?? {};
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);

  const where = {
    ...filter,
    ...(q
      ? {
          OR: [
            { orderRef: { contains: q, mode: 'insensitive' as const } },
            { customerName: { contains: q, mode: 'insensitive' as const } },
            { customerEmail: { contains: q, mode: 'insensitive' as const } },
            { payerReference: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [rows, completed] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, orderRef: true, amount: true, amountMinor: true, currency: true, method: true,
        planType: true, status: true, customerName: true, customerEmail: true,
        payerReference: true, createdAt: true, completedAt: true, reviewNote: true,
      },
    }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amountMinor: true }, _count: { _all: true } }),
  ]);

  const slugs = Array.from(new Set(rows.map((r) => r.planType)));
  const plans = slugs.length
    ? await prisma.pricingPlan.findMany({ where: { slug: { in: slugs } }, select: { slug: true, nameEn: true } })
    : [];
  const nameBySlug = new Map(plans.map((p) => [p.slug, p.nameEn]));

  return NextResponse.json({
    totals: {
      completedCount: completed._count._all,
      completedMinor: completed._sum.amountMinor ?? 0,
    },
    payments: rows.map((p) => ({
      id: p.id,
      orderRef: p.orderRef,
      amountMinor: p.amountMinor || Math.round((p.amount ?? 0) * 100),
      currency: p.currency,
      method: p.method,
      planType: p.planType,
      planName: nameBySlug.get(p.planType) ?? null,
      status: p.status,
      customerName: p.customerName,
      customerEmail: p.customerEmail,
      payerReference: p.payerReference,
      createdAt: p.createdAt.toISOString(),
      completedAt: p.completedAt?.toISOString() ?? null,
      reviewNote: p.reviewNote,
    })),
  });
}
