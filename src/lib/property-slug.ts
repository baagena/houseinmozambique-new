/**
 * The readable address a listing is served from.
 *
 * `/properties/cmtwmvb4i000004l2tohji25a` tells a search engine nothing and a
 * person less. `/properties/3-bedroom-apartment-for-sale-costa-do-sol-maputo`
 * carries the type, the intent, the bairro and the city — which is precisely
 * the query somebody types — and it survives being pasted into WhatsApp as
 * something a reader can judge before tapping.
 *
 * The wizard has generated this exact string all along and shown it to the
 * agent under "What search engines will see". It was simply never stored or
 * routed, so the preview promised one URL and the site served another.
 */

import { prisma } from '@/lib/db';
import { slugify } from '@/lib/listing-copy';

/** A cuid, which is what the old URLs carry. */
export function looksLikeId(value: string): boolean {
  return /^c[a-z0-9]{20,}$/i.test(value);
}

/**
 * Builds the slug from the same parts the wizard uses, so a listing made
 * through the wizard and one made through the admin form read alike.
 */
export function buildPropertySlug(p: {
  bedrooms?: number | null;
  type?: string | null;
  listingType?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  title?: string | null;
}): string {
  const intent =
    p.listingType === 'Buy' ? 'for sale'
    : p.listingType === 'Rent' ? 'for rent'
    : p.listingType === 'Short Stay' ? 'short stay'
    : p.listingType === 'Auction' ? 'auction'
    : '';

  const isLand = (p.type ?? '').toLowerCase() === 'land';

  const parts = isLand
    ? ['land', intent, p.neighborhood, p.city]
    : [p.bedrooms ? `${p.bedrooms} bedroom` : '', p.type, intent, p.neighborhood, p.city];

  const built = slugify(parts.filter(Boolean).join(' '));

  /*
   * Fall back to the title only when the structured fields give nothing. A
   * hand-typed title can be a paragraph of shouting capitals — there is one in
   * the database beginning "🇲🇿 OPORTUNIDADE COMERCIAL PREMIUM 🇲🇿" — so it is
   * the last resort and it is cut short.
   */
  if (built) return built;
  return slugify((p.title ?? 'listing').split(/\s+/).slice(0, 8).join(' ')) || 'listing';
}

/**
 * Makes it unique, because two identical flats in the same bairro produce the
 * same words.
 *
 * Suffixes `-2`, `-3`… rather than appending the id: the point of the exercise
 * is a URL a person can read, and gluing a cuid on the end gives back exactly
 * what we were trying to get away from.
 */
export async function uniquePropertySlug(base: string, ignoreId?: string): Promise<string> {
  const root = base.slice(0, 80).replace(/-+$/, '') || 'listing';

  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const clash = await prisma.property.findFirst({
      where: { slug: candidate, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
  }

  /*
   * Fifty listings sharing a description is not a naming problem any more.
   * A short random tail is uglier than `-51` but it always terminates.
   */
  return `${root}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Resolves whatever is in the URL — a slug, or a cuid from a link shared
 * before slugs existed.
 *
 * Returns the canonical path too, so the page can redirect an id to the slug
 * rather than serving the same listing at two addresses, which splits whatever
 * ranking it has earned between them.
 */
export async function resolvePropertyRef(ref: string): Promise<{
  id: string;
  slug: string | null;
  canonicalPath: string;
  shouldRedirect: boolean;
} | null> {
  const found = await prisma.property.findFirst({
    where: looksLikeId(ref) ? { id: ref } : { slug: ref },
    select: { id: true, slug: true },
  });
  if (!found) return null;

  const canonical = found.slug ?? found.id;
  return {
    id: found.id,
    slug: found.slug,
    canonicalPath: `/properties/${canonical}`,
    // Only when the visitor asked for something other than the canonical name.
    shouldRedirect: ref !== canonical,
  };
}
