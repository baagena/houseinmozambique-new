import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireBearerAgent } from '@/lib/mobile-auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.hostId !== auth.agent.id) {
    return NextResponse.json({ error: 'Not authorized to edit this listing.' }, { status: 403 });
  }

  try {
    const { formData, imageUrls } = await request.json();

    const updated = await prisma.property.update({
      where: { id },
      data: {
        title: formData.title,
        description: formData.description,
        location: formData.address || formData.neighborhood || formData.city,
        city: formData.city,
        neighborhood: formData.neighborhood,
        address: formData.address,
        price: parseFloat(formData.price),
        priceUnit: formData.priceUnit,
        type: formData.propertyType,
        listingType: formData.listingType,
        bedrooms: parseInt(formData.bedrooms.toString()),
        bathrooms: parseInt(formData.bathrooms.toString()),
        area: parseFloat(formData.area.toString()) || 0,
        amenities: formData.amenities,
        images: imageUrls,
        tags: formData.tags ?? [],
        status: 'PENDING',
        isNew: true,
      },
    });

    revalidatePath('/dashboard/agent/listings');
    revalidatePath('/properties');
    revalidatePath(`/properties/${id}`);

    return NextResponse.json({ property: updated });
  } catch (error: any) {
    console.error('Mobile property update failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to update property.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.hostId !== auth.agent.id) {
    return NextResponse.json({ error: 'Not authorized to delete this listing.' }, { status: 403 });
  }

  await prisma.property.delete({ where: { id } });

  revalidatePath('/dashboard/agent/listings');
  revalidatePath('/dashboard/agent');
  revalidatePath('/properties');
  revalidatePath(`/properties/${id}`);

  return NextResponse.json({ success: true });
}
