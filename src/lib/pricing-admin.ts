import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import type { PlanFeature } from '@/lib/pricing';

/** Only a super admin may read or write pricing. */
export async function requirePricingAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return null;
  const agent = await prisma.agent.findUnique({ where: { id: userId }, select: { role: true } });
  return agent?.role === 'ADMIN' ? agent : null;
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
