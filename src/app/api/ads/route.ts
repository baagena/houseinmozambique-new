import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { PUBLIC_DATA_TAG } from '@/lib/public-cache';

/*
 * The site header asks for this on every page, so the query is cached: purged
 * after any edit to an ad (lib/public-cache.ts), with the hour as a backstop.
 */
const getActiveAds = unstable_cache(
  () =>
    prisma.advertisement.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
    }),
  ['api-ads'],
  { tags: [PUBLIC_DATA_TAG], revalidate: 3600 },
);

export async function GET() {
  return NextResponse.json(await getActiveAds());
}
