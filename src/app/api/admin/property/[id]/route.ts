import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { error: 'Not authenticated', status: 401 as const };
  }

  const admin = await prisma.agent.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Forbidden - admins only', status: 403 as const };
  }

  return { userId };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
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
