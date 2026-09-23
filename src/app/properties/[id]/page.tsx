import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPropertyById, getProperties } from '@/lib/data';
import PropertyDetailClient from '@/components/properties/PropertyDetailClient';
import JsonLd from '@/components/seo/JsonLd';
import { buildMetadata, realEstateListingJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { formatPrice } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { listingHeadline } from '@/lib/listing-copy';
import { resolvePropertyRef } from '@/lib/property-slug';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: ref } = await params;
  const resolved = await resolvePropertyRef(ref);

  if (!resolved) {
    return buildMetadata({ title: 'Property not found', path: `/properties/${ref}`, noindex: true });
  }

  const property = await getPropertyById(resolved.id);
  if (!property) {
    return buildMetadata({ title: 'Property not found', path: `/properties/${ref}`, noindex: true });
  }

  /* The canonical is the slug, never the id — otherwise a listing shared by
     its old id and one shared by its slug compete with each other for the
     ranking they should be pooling. */
  const canonicalPath = resolved.canonicalPath;

  /*
   * One language in the <head>, matching the one in the <body>.
   *
   * This paired the English `title` with the first 200 characters of the
   * Portuguese `description` — two languages inside a single head, and a
   * snippet cut mid-word wherever the body ran past 200. The page is served in
   * Portuguese (see <html lang> in the root layout), so the head is Portuguese.
   *
   * `metaPt` is the description the wizard composed beside the body and tuned
   * against the 140-160 characters search actually shows; it had been
   * displayed to the agent under "What search engines will see" but never
   * stored, so what they were shown was never what shipped. Listings from
   * before it existed still fall back to the body slice.
   */
  const locationLabel = [property.neighborhood, property.city].filter(Boolean).join(', ');
  const price = formatPrice(property.price, property.priceUnit);
  const headline = listingHeadline(property, 'pt');
  /*
   * The place goes in once. A generated headline already ends in the bairro and
   * city, so appending them again gave "Moradia T3 à venda na Costa do Sol,
   * Maputo — MT 12,500,000 em Costa do Sol, Maputo" — and the repeat pushed the
   * price past where search truncates. A hand-written headline usually has no
   * location in it, and still gets one.
   */
  const placeAlreadyInTitle =
    !!locationLabel && headline.toLowerCase().includes(locationLabel.toLowerCase());
  const title = `${headline} — ${price}${locationLabel && !placeAlreadyInTitle ? ` em ${locationLabel}` : ''}`;
  const description =
    property.metaPt?.trim() ||
    property.description?.slice(0, 200) ||
    `${property.bedrooms}-bed ${property.type} for ${property.listingType.toLowerCase()} in ${property.city}, Mozambique. ${price}.`;

  return buildMetadata({
    title,
    description,
    path: canonicalPath,
    images: property.images?.length ? property.images.slice(0, 4) : undefined,
    keywords: [
      `${property.type} ${property.city}`,
      `${property.listingType} ${property.city}`,
      `${property.bedrooms} bedroom ${property.type}`,
      'Mozambique real estate',
    ],
  });
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id: ref } = await params;

  const resolved = await resolvePropertyRef(ref);
  if (!resolved) notFound();

  /*
   * An id in the URL is answered with a permanent move to the slug.
   *
   * Every link shared before slugs existed still works, and search is told
   * once that the readable address is the real one — rather than being left to
   * index the same listing twice and split its ranking between the two.
   *
   * 301 and not 307: a temporary redirect tells search to keep the old URL and
   * check back, so the ranking these listings have already earned would stay
   * attached to the cuid it is moving away from. `redirect()` issues 307;
   * `permanentRedirect()` is the one that transfers it.
   */
  if (resolved.shouldRedirect) permanentRedirect(resolved.canonicalPath);

  const id = resolved.id;
  const property = await getPropertyById(id);

  if (!property) notFound();

  await prisma.property.update({ where: { id }, data: { views: { increment: 1 } } });

  const allProperties = await getProperties();
  /* Four, to fill the row the grid now lays out. Three left a gap at the end
     of the line and one — which is what the rent listings actually had — read
     as a rendering fault rather than a short list. */
  const similar = allProperties
    .filter((p) => p.id !== property.id && p.listingType === property.listingType)
    .slice(0, 4);

  const jsonLd = [
    realEstateListingJsonLd(property),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Properties', path: '/properties' },
      { name: property.title, path: `/properties/${property.slug ?? property.id}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PropertyDetailClient property={property} similar={similar} />
    </>
  );
}
