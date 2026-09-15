import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

interface Params {
  params: Promise<{ id: string }>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}


export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });
    }

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
        ...(body.isFeatured !== undefined ? { isFeatured: Boolean(body.isFeatured) } : {}),
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            initials: true,
            title: true,
            location: true,
          },
        },
      },
    });

    revalidatePath('/dashboard/admin/approvals');
    revalidatePath('/dashboard/admin/properties');
    revalidatePath('/properties');
    revalidatePath(`/properties/${id}`);
    revalidatePath('/');

    return NextResponse.json({ success: true, property: updated });
  } catch (error) {
    console.error('Admin property edit error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to update property.') },
      { status: 500 }
    );
  }
}
