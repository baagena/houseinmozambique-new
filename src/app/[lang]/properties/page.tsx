import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { getProperties } from '@/lib/data';
import { prisma } from '@/lib/db';
import PropertiesClient from '@/components/properties/PropertiesClient';
import { Suspense } from 'react';
import { buildMetadata } from '@/lib/seo';
import { sanitizeProperties } from '@/lib/mobile-serialize';
import { PUBLIC_DATA_TAG } from '@/lib/public-cache';

/*
 * The one public page still rendered per visit: it reads the filters in the
 * address (?type=, ?agent=) on the server. Its data is cached instead, so a
 * visit renders but does not query. The cache is purged with the pages (see
 * lib/public-cache.ts). Dates arrive as strings this way, which the listing
 * components already accept.
 */
/* Said outright: nothing is rendered at build time any more, so Next would
   not otherwise learn that this page reads the address until a visit failed. */
export const dynamic = 'force-dynamic';

const getListingData = unstable_cache(
  async (agentId: string | undefined) => {
    const [properties, ads] = await Promise.all([
      getProperties({ agentId }),
      prisma.advertisement.findMany({
        where: { isActive: true },
        orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
      }),
    ]);
    return { properties: sanitizeProperties(properties), ads };
  },
  ['properties-page'],
  { tags: [PUBLIC_DATA_TAG], revalidate: 3600 },
);

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
    agent?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  
  // Every listing, filtered in the browser; ?agent= narrows it on the server.
  const { properties, ads } = await getListingData(params.agent || undefined);

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
        initialProperties={properties as any}
        initialType={params.type}
        initialLocation={params.location}
        ads={ads as any}
      />
    </Suspense>
  );
}
