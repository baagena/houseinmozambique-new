import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireBearerAgent } from '@/lib/mobile-auth';
import { sendPropertySubmissionNotification } from '@/lib/email';

export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const properties = await prisma.property.findMany({
    where: { hostId: auth.agent.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ properties });
}

export async function POST(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { formData, imageUrls } = await request.json();

    const property = await prisma.property.create({
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
        images: imageUrls || [],
        tags: formData.tags ?? [],
        hostId: auth.agent.id,
        status: 'PENDING',
        isNew: true,
      },
    });

    revalidatePath('/');
    revalidatePath('/properties');
    revalidatePath('/dashboard/agent');
    revalidatePath('/dashboard/agent/listings');
    revalidatePath('/dashboard/admin/approvals');
    revalidatePath('/dashboard/admin/properties');

    try {
      await sendPropertySubmissionNotification(property, { name: auth.agent.name, email: auth.agent.email });
    } catch (error) {
      console.error('Property notification email failed:', error);
    }

    return NextResponse.json({ property }, { status: 201 });
  } catch (error: any) {
    console.error('Mobile property create failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to create property.' }, { status: 500 });
  }
}
