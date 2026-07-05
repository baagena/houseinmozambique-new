import type { Metadata } from 'next';
import { getProperties } from '@/lib/data';
export const dynamic = 'force-dynamic';
import PropertiesClient from '@/components/properties/PropertiesClient';
import { Suspense } from 'react';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Properties for Sale, Rent & Short Stay in Mozambique',
  description:
    'Browse curated property listings across Mozambique — buy, rent, or book short stays in Maputo, Inhambane, Beira, Nampula and beyond. Filter by city, type, and price.',
  path: '/properties',
});

interface Props {
  searchParams: Promise<{
    type?: string;
    location?: string;
    propertyType?: string;
    isFeatured?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  
  // Fetch initial properties based on URL params if needed, 
  // but for the current interactive UI, we fetch all and let the client filter.
  const allProperties = await getProperties();

  return (
    <div className="pt-20 min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002045]" />
        </div>
      }>
        <PropertiesClient 
          initialProperties={allProperties as any} 
          initialType={params.type}
          initialLocation={params.location}
        />
      </Suspense>
    </div>
  );
}
