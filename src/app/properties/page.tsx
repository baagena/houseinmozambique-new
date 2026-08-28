import type { Metadata } from 'next';
import { getProperties } from '@/lib/data';
import { prisma } from '@/lib/db';
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
  const ads = await prisma.advertisement.findMany({
    where: { isActive: true },
    orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
  });

  return (
    <Suspense
      fallback={
        <div className="wrap section">
          <div className="grid-cards">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card">
                <div className="card__media sk" />
                <div className="card__body">
                  <div className="sk h-5 w-2/5" />
                  <div className="sk mt-2 h-4 w-4/5" />
                  <div className="sk mt-2 h-3 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <PropertiesClient
        initialProperties={allProperties as any}
        initialType={params.type}
        initialLocation={params.location}
        ads={ads as any}
      />
    </Suspense>
  );
}
