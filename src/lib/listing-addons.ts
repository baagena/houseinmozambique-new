/**
 * Paid boosts on a single listing.
 *
 * The one thing the platform was giving away: `PricingPlan.featuredQuota`
 * existed and was read by nothing, `Property.isFeatured` was editorial-only,
 * and there was no way for an agent to pay to push a listing up. An agency
 * that wants its best property seen had no way to spend money on it.
 *
 * Deliberately NOT a credit balance. An agent already holds two numbers in
 * their head — listings left on the plan, and unspent one-off credits — and a
 * third would make "can I publish this" a three-part question. A boost is
 * bought for one listing at the moment the agent wants that listing pushed,
 * which is also the moment they can judge whether it is worth it.
 */

import { prisma } from '@/lib/db';

export type AddonKind = 'FEATURED' | 'URGENT';

/**
 * Add-ons are PricingPlan rows with `kind: "addon"`, so the admin names and
 * prices them on the screen they already use, checkout charges
 * `priceMinor` server-side exactly as it does for a plan, and the manual
 * payment machinery — reference, proof, admin verification — works unchanged.
 *
 * The slug is the contract between that row and this code.
 */
export const ADDON_SLUG: Record<AddonKind, string> = {
  FEATURED: 'addon-featured',
  URGENT: 'addon-urgent',
};

/** Default run length when the plan row does not set one. */
const DEFAULT_ADDON_DAYS = 30;

export interface AddonOffer {
  kind: AddonKind;
  planId: string;
  slug: string;
  nameEn: string;
  namePt: string;
  descriptionEn: string;
  descriptionPt: string;
  priceMinor: number;
  currency: string;
  days: number;
}

/**
 * What can actually be bought right now.
 *
 * An add-on with no PricingPlan row, or one priced at zero, is simply not
 * offered — the same rule as the payment destination and the free-rental
 * ceiling. Nothing here invents a price.
 */
export async function addonOffers(): Promise<AddonOffer[]> {
  const rows = await prisma.pricingPlan.findMany({
    where: { kind: 'addon', isActive: true, priceMinor: { gt: 0 } },
    orderBy: { sortOrder: 'asc' },
  });

  const byKind = new Map<string, AddonKind>(
    Object.entries(ADDON_SLUG).map(([k, slug]) => [slug, k as AddonKind]),
  );

  return rows
    .filter((r) => byKind.has(r.slug))
    .map((r) => ({
      kind: byKind.get(r.slug)!,
      planId: r.id,
      slug: r.slug,
      nameEn: r.nameEn,
      namePt: r.namePt,
      descriptionEn: r.descriptionEn,
      descriptionPt: r.descriptionPt,
      priceMinor: r.priceMinor,
      currency: r.currency,
      days: r.durationDays ?? DEFAULT_ADDON_DAYS,
    }));
}

/** The boosts running on a listing right now. */
export async function activeAddons(propertyId: string): Promise<AddonKind[]> {
  const now = new Date();
  const rows = await prisma.listingAddon.findMany({
    where: {
      propertyId,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { kind: true },
  });
  return rows.map((r) => r.kind as AddonKind);
}

/**
 * Records an add-on the agent has chosen but not yet paid for.
 *
 * PENDING, and setting no flag on the property: a boost that has not been paid
 * for must not run. It is activated by activateAddonsForPayment() when the
 * money settles, which is the same gate every other paid thing here goes
 * through.
 */
export async function reserveAddon(opts: {
  propertyId: string;
  kind: AddonKind;
  planId: string;
  paymentId: string;
}) {
  return prisma.listingAddon.create({
    data: {
      propertyId: opts.propertyId,
      planId: opts.planId,
      kind: opts.kind,
      paymentId: opts.paymentId,
      status: 'PENDING',
    },
  });
}

/**
 * Turns a settled add-on payment into a running boost.
 *
 * Idempotent on the add-on's own status, so a webhook retry or a second admin
 * approval cannot extend the window twice.
 */
export async function activateAddonsForPayment(paymentId: string): Promise<number> {
  const pending = await prisma.listingAddon.findMany({
    where: { paymentId, status: 'PENDING' },
    include: { plan: { select: { durationDays: true } } },
  });
  if (pending.length === 0) return 0;

  const now = new Date();

  for (const addon of pending) {
    const days = addon.plan.durationDays ?? DEFAULT_ADDON_DAYS;
    await prisma.listingAddon.update({
      where: { id: addon.id },
      data: {
        status: 'ACTIVE',
        startsAt: now,
        expiresAt: new Date(now.getTime() + days * 86_400_000),
      },
    });

    /*
     * The flag on the property is what search and the homepage read.
     *
     * `isFeatured` is shared with the admin's editorial choice, so buying a
     * feature can turn it ON but expiry must never turn it off blindly — see
     * sweepAddons(), which only clears a flag it can prove it set.
     */
    await prisma.property.update({
      where: { id: addon.propertyId },
      data: addon.kind === 'URGENT' ? { isUrgent: true } : { isFeatured: true },
    });
  }

  return pending.length;
}

/**
 * Closes boosts whose window has run out, and lowers the flags they raised.
 *
 * A flag is only lowered when no OTHER active add-on of the same kind is
 * running on that property — and, for FEATURED, the sweep cannot tell an
 * editorial feature from a paid one, so it lowers the flag only if a paid
 * add-on is the reason it went up. The alternative silently un-features
 * whatever the team put on the homepage.
 */
export async function sweepAddons(): Promise<number> {
  const now = new Date();

  const done = await prisma.listingAddon.findMany({
    where: { status: 'ACTIVE', expiresAt: { lt: now } },
    select: { id: true, propertyId: true, kind: true },
  });
  if (done.length === 0) return 0;

  await prisma.listingAddon.updateMany({
    where: { id: { in: done.map((d) => d.id) } },
    data: { status: 'EXPIRED' },
  });

  for (const d of done) {
    const stillRunning = await prisma.listingAddon.count({
      where: {
        propertyId: d.propertyId,
        kind: d.kind,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
    if (stillRunning > 0) continue;

    await prisma.property.update({
      where: { id: d.propertyId },
      data: d.kind === 'URGENT' ? { isUrgent: false } : { isFeatured: false },
    });
  }

  return done.length;
}
