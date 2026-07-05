import { NextResponse } from 'next/server';
import {
  getFeaturedProperties,
  getPropertiesByCity,
  getProperties,
} from '@/lib/data';
import { prisma } from '@/lib/db';
import { sanitizeProperties } from '@/lib/mobile-serialize';
import { AGENT_PUBLIC_SELECT } from '@/lib/mobile-auth';

export async function GET() {
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
    prisma.agent.findMany({ where: { isFeatured: true }, take: 10, select: AGENT_PUBLIC_SELECT }),
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

  return NextResponse.json({
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
  });
}
