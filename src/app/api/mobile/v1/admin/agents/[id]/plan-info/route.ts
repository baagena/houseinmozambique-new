import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';
import { getEntitlementState } from '@/lib/entitlements';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * What the "grant a plan" panel needs for one agent (web:
 * dashboard/admin/agents/[id]): their listing counts, the plan in force, and
 * the plans staff can sell by hand. The grant itself goes to the shared
 * POST /api/admin/agent/:id/plan.
 */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    select: { id: true, name: true, role: true, agencyName: true, corporateStatus: true },
  });
  if (!agent) return NextResponse.json({ error: 'Agent not found.' }, { status: 404 });

  const [plans, entitlement, statusCounts] = await Promise.all([
    // Plans the team can sell by hand: everything except the free tier.
    prisma.pricingPlan.findMany({
      where: { isActive: true, kind: { not: 'addon' }, NOT: { priceMinor: 0, ctaMode: 'checkout' } },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, namePt: true, nameEn: true, kind: true, pricePt: true, unitPt: true, listingQuota: true, featuredQuota: true, durationDays: true },
    }),
    getEntitlementState(agent.id, agent.role),
    prisma.property.groupBy({ by: ['status'], where: { hostId: id }, _count: { _all: true } }),
  ]);

  const isCorporate = Boolean(agent.corporateStatus || agent.agencyName);
  const count = (s: string) => statusCounts.find((c) => c.status === s)?._count._all ?? 0;

  return NextResponse.json({
    isCorporate,
    currentPlan: entitlement.planName,
    credits: entitlement.credits,
    // How full the plan is, for the admin's "does this person need a plan?"
    quota: entitlement.quota,
    used: entitlement.used,
    canPublish: entitlement.canPublish,
    inGrace: entitlement.inGrace,
    periodEnd: entitlement.periodEnd?.toISOString() ?? null,
    role: agent.role,
    listings: {
      total: statusCounts.reduce((sum, c) => sum + c._count._all, 0),
      live: count('PUBLISHED'),
      pending: count('PENDING'),
      rejected: count('REJECTED'),
    },
    plans: plans
      .filter((p) => !isCorporate || p.kind === 'subscription')
      .map((p) => ({
        slug: p.slug,
        name: p.namePt || p.nameEn,
        kind: p.kind,
        price: `${p.pricePt ?? ''} ${p.unitPt ?? ''}`.trim(),
        // What it unlocks, for the iPhone "give access" sheet, which names
        // capabilities rather than plans or prices (App Store 3.1).
        listingQuota: p.listingQuota,
        featuredQuota: p.featuredQuota,
        durationDays: p.durationDays,
      })),
  });
}
