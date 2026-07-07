import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin, AGENT_PUBLIC_SELECT } from '@/lib/mobile-auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json();

  const price = Number(body.price);
  const bedrooms = Number(body.bedrooms);
  const bathrooms = Number(body.bathrooms);
  const area = Number(body.area);

  if (!body.title || !body.description || !body.city || !body.type || !body.listingType) {
    return NextResponse.json({ error: 'Missing required property fields.' }, { status: 400 });
  }

  if ([price, bedrooms, bathrooms, area].some((value) => Number.isNaN(value))) {
    return NextResponse.json({ error: 'Price, bedrooms, bathrooms, and area must be numbers.' }, { status: 400 });
  }

  const updated = await prisma.property.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      location: body.address || body.neighborhood || body.city,
      city: body.city,
      neighborhood: body.neighborhood || null,
      address: body.address || null,
      price,
      priceUnit: body.priceUnit || 'sale',
      type: body.type,
      listingType: body.listingType,
      bedrooms,
      bathrooms,
      area,
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      images: Array.isArray(body.images) ? body.images : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      badge: body.badge || null,
    },
    include: { host: { select: AGENT_PUBLIC_SELECT } },
  });

  return NextResponse.json({ success: true, property: updated });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
