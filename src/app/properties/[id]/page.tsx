import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropertyById, getProperties } from '@/lib/data';
import PropertyDetailClient from '@/components/properties/PropertyDetailClient';
import JsonLd from '@/components/seo/JsonLd';
import { buildMetadata, realEstateListingJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { formatPrice } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) {
    return buildMetadata({ title: 'Property not found', path: `/properties/${id}`, noindex: true });
  }

  const locationLabel = [property.neighborhood, property.city].filter(Boolean).join(', ');
  const price = formatPrice(property.price, property.priceUnit);
  const title = `${property.title} — ${price}${locationLabel ? ` in ${locationLabel}` : ''}`;
  const description =
    property.description?.slice(0, 200) ||
    `${property.bedrooms}-bed ${property.type} for ${property.listingType.toLowerCase()} in ${property.city}, Mozambique. ${price}.`;

  return buildMetadata({
    title,
    description,
    path: `/properties/${property.id}`,
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
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  const allProperties = await getProperties();
  const similar = allProperties.filter((p) => p.id !== property.id && p.listingType === property.listingType).slice(0, 3);

  const jsonLd = [
    realEstateListingJsonLd(property),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Properties', path: '/properties' },
      { name: property.title, path: `/properties/${property.id}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PropertyDetailClient property={property} similar={similar} />
    </>
  );
}
