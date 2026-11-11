import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { PUBLIC_DATA_TAG } from '@/lib/public-cache';
import {
  getFeaturedProperties,
  getPropertiesByCity,
  getProperties,
} from '@/lib/data';
import { prisma } from '@/lib/db';
import { sanitizeProperties } from '@/lib/mobile-serialize';
import { AGENT_PUBLIC_SELECT } from '@/lib/mobile-auth';

/*
 * The app asks for this on every launch, so the payload is cached: purged
 * after any edit to what it returns (lib/public-cache.ts), with the hour as a
 * backstop. A data cache rather than a prerendered route, so `next build` does
 * not query the database.
 */
const getHomePayload = unstable_cache(
  async () => {
    const [
      featured,
      featuredAgents,
      maputoProps,
      inhamProps,
      beiraProps,
      nampulaProps,
      teteProps,
      pembaProps,
      allProperties,
      ads,
    ] = await Promise.all([
      getFeaturedProperties(),
      prisma.agent.findMany({ where: { isFeatured: true, role: 'AGENT' }, take: 10, select: AGENT_PUBLIC_SELECT }),
      getPropertiesByCity('Maputo'),
      getPropertiesByCity('Inhambane'),
      getPropertiesByCity('Beira'),
      getPropertiesByCity('Nampula'),
      getPropertiesByCity('Tete'),
      getPropertiesByCity('Pemba'),
      getProperties(),
      prisma.advertisement.findMany({
        where: { isActive: true },
        orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
      }),
    ]);

    const rentProps = allProperties.filter((p) => p.listingType === 'Rent').slice(0, 8);
    const buyProps = allProperties.filter((p) => p.listingType === 'Buy').slice(0, 8);
    const shortStayProps = allProperties.filter((p) => p.listingType === 'Short Stay').slice(0, 8);

    return {
      featured: sanitizeProperties(featured),
      featuredAgents,
      cities: {
        maputo: sanitizeProperties(maputoProps),
        inhambane: sanitizeProperties(inhamProps),
        beira: sanitizeProperties(beiraProps),
        nampula: sanitizeProperties(nampulaProps),
        tete: sanitizeProperties(teteProps),
        pemba: sanitizeProperties(pembaProps),
      },
      listingTypes: {
        rent: sanitizeProperties(rentProps),
        buy: sanitizeProperties(buyProps),
        shortStay: sanitizeProperties(shortStayProps),
      },
      ads,
    };
  },
  ['mobile-home'],
  { tags: [PUBLIC_DATA_TAG], revalidate: 3600 },
);

export async function GET() {
  return NextResponse.json(await getHomePayload());
}
