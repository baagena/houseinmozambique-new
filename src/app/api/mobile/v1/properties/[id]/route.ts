import { NextResponse } from 'next/server';
import { getPropertyById, getProperties } from '@/lib/data';
import { sanitizeProperty, sanitizeProperties } from '@/lib/mobile-serialize';
import { isLikelyBot, recordPropertyView } from '@/lib/property-views';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property || property.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  // Opening a listing in the app is a view too; it was never counted before.
  // Not awaited into the response: a failed count must not fail the page.
  if (!isLikelyBot(request.headers.get('user-agent'))) {
    recordPropertyView(property.id).catch(() => {});
  }

  const similarRaw = await getProperties({ listingType: property.listingType, take: 4 });
  const similar = similarRaw.filter((p) => p.id !== property.id).slice(0, 3);

  return NextResponse.json({
    property: sanitizeProperty(property),
    similar: sanitizeProperties(similar),
  });
}
