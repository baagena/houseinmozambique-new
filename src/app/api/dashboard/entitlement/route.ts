import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { getEntitlementState, ensureFreePlan } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

/**
 * What the wizard needs to tell an agent where they stand — BEFORE they start.
 *
 * The research on usage paywalls is consistent on one point: the limit has to
 * be surfaced at the moment it becomes relevant, and never as a wall that
 * appears after the work is done. So the wizard asks this on open, warns in a
 * banner, and lets the agent build the listing either way. The decision about
 * paying is taken at the end, with the finished listing in front of them,
 * which is also the moment they can actually judge whether it is worth it.
 *
 * It returns the agent's own live listings too, because "take one down to free
 * a slot" is the third door and it cannot be offered without showing them
 * which listings they would be choosing between.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') await ensureFreePlan(session.id);

  const [state, plans, listings] = await Promise.all([
    getEntitlementState(session.id, session.role),
    prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        slug: true, kind: true, nameEn: true, namePt: true, priceMinor: true,
        currency: true, interval: true, listingQuota: true, durationDays: true,
        highlighted: true,
      },
    }),
    prisma.property.findMany({
      where: { hostId: session.id, status: { in: ['PUBLISHED', 'PENDING'] } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, titlePt: true, status: true, city: true,
        neighborhood: true, images: true, views: true, createdAt: true,
      },
    }),
  ]);

  /*
   * Only plans that are a step FORWARD are offered.
   *
   * A paywall that lists every tier including the one they are already on, and
   * the cheaper one below it, makes the agent do the comparison. The upgrade
   * is whichever active subscription grants more live listings than the
   * current plan; the single-listing option is separate because it is a
   * different decision, not a smaller version of the same one.
   */
  const upgrades = plans.filter(
    (p) => p.kind === 'subscription'
      && p.slug !== state.planSlug
      && (p.listingQuota === -1 || p.listingQuota > state.quota),
  );
  const oneOffs = plans.filter((p) => p.kind === 'one_off' && p.priceMinor > 0);

  return NextResponse.json({
    state,
    upgrades,
    oneOffs,
    listings: listings.map((l) => ({
      id: l.id,
      title: l.titlePt?.trim() || l.title,
      status: l.status,
      place: [l.neighborhood, l.city].filter(Boolean).join(', '),
      cover: l.images?.[0] ?? null,
      views: l.views ?? 0,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
