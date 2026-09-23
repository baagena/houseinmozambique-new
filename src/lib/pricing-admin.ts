import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import type { PlanFeature } from '@/lib/pricing';

/** Only a super admin may read or write pricing. Thin alias over the shared guard. */
export async function requirePricingAdmin() {
  return await requireAdmin();
}

/** Accept whatever the form sends and store a clean feature array. */
export function sanitizeFeatures(value: unknown): PlanFeature[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      label: String(entry.label ?? '').trim(),
      included: entry.included !== false,
      star: entry.star === true,
    }))
    .filter((entry) => entry.label.length > 0);
}

/**
 * Major units from the form to centavos, rejecting anything that is not money.
 *
 * Rounded, not truncated: 3500.999 typed by accident becomes 350100 rather than
 * 350099, and a NaN becomes 0 (a free plan) rather than a database error.
 */
export function toMinor(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(Math.min(n, 10_000_000) * 100);
}

/** An amount already in centavos: bounded and forced to a whole number. */
export function clampMinor(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(Math.min(n, 1_000_000_000));
}

/** -1 means unlimited and is the only negative allowed through. */
export function toQuota(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return -1;
  return Math.min(Math.trunc(n), 100_000);
}

/** Normalise a free-text key into a URL-safe slug. */
export function toSlug(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Shared field mapping for create and update. Portuguese fields fall back to the
 * English ones so a plan is never blank for pt visitors.
 */
export function planDataFromBody(body: any) {
  const badgeEn = body.badgeEn ? String(body.badgeEn).trim() : '';
  return {
    slug: toSlug(body.slug),
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,

    /*
     * The billing half, validated here because this is the only door to it.
     * `priceMinor` arrives as MAJOR units from the form — an admin types 3500,
     * not 350000 — and is converted once, at the edge, so nothing downstream
     * has to remember which unit it is holding.
     */
    kind: body.kind === 'one_off' ? 'one_off' : 'subscription',
    // `priceMinor` is already centavos (the admin form converts on input);
    // `priceMajor` is meticais and needs converting. Accepting both and
    // running toMinor() over either would multiply the centavo path by 100.
    priceMinor: body.priceMajor != null ? toMinor(body.priceMajor) : clampMinor(body.priceMinor),
    currency: String(body.currency || 'MZN').toUpperCase().slice(0, 3),
    interval: body.kind === 'one_off'
      ? null
      : body.interval === 'year' ? 'year' : 'month',
    listingQuota: toQuota(body.listingQuota, 1),
    featuredQuota: Math.max(0, toQuota(body.featuredQuota, 0)),
    durationDays: body.kind === 'one_off'
      ? Math.max(1, Number(body.durationDays) || 60)
      : null,
    isActive: body.isActive ?? true,
    highlighted: body.highlighted ?? false,
    ctaMode: body.ctaMode === 'contact' ? 'contact' : 'checkout',
    nameEn: String(body.nameEn || '').trim(),
    namePt: String(body.namePt || body.nameEn || '').trim(),
    descriptionEn: String(body.descriptionEn || '').trim(),
    descriptionPt: String(body.descriptionPt || body.descriptionEn || '').trim(),
    priceEn: String(body.priceEn || '').trim(),
    pricePt: String(body.pricePt || body.priceEn || '').trim(),
    unitEn: String(body.unitEn || '').trim(),
    unitPt: String(body.unitPt || body.unitEn || '').trim(),
    badgeEn: badgeEn || null,
    badgePt: (body.badgePt ? String(body.badgePt).trim() : badgeEn) || null,
    ctaEn: String(body.ctaEn || '').trim(),
    ctaPt: String(body.ctaPt || body.ctaEn || '').trim(),
    // Prisma types Json columns as InputJsonValue; our feature rows are plain data.
    featuresEn: sanitizeFeatures(body.featuresEn) as unknown as Prisma.InputJsonValue,
    featuresPt: sanitizeFeatures(body.featuresPt) as unknown as Prisma.InputJsonValue,
  };
}

/** Every surface that renders plan pricing. */
export function revalidatePricing() {
  revalidatePath('/pricing');
  revalidatePath('/post-property');
}
