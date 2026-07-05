import { NextResponse } from 'next/server';
import { getProperties, countProperties } from '@/lib/data';
import { sanitizeProperties } from '@/lib/mobile-serialize';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const listingType = searchParams.get('listingType') || undefined;
  const city = searchParams.get('city') || undefined;
  const propertyType = searchParams.getAll('propertyType').filter(Boolean);
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const bedrooms = searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined;
  const bathrooms = searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined;
  const sort = (searchParams.get('sort') as 'newest' | 'oldest' | 'price_asc' | 'price_desc' | null) || undefined;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));

  const filters = {
    listingType,
    city,
    propertyType: propertyType.length > 0 ? propertyType : undefined,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
  };

  const [properties, total] = await Promise.all([
    getProperties({ ...filters, sort, skip: (page - 1) * limit, take: limit }),
    countProperties(filters),
  ]);

  return NextResponse.json({
    properties: sanitizeProperties(properties),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
