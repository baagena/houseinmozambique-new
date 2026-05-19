import { notFound } from 'next/navigation';
import { getPropertyById, getProperties } from '@/lib/data';
import PropertyDetailClient from '@/components/properties/PropertyDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  const allProperties = await getProperties();
  const similar = allProperties.filter((p) => p.id !== property.id && p.listingType === property.listingType).slice(0, 3);

  return <PropertyDetailClient property={property} similar={similar} />;
}
