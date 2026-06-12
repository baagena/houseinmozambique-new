'use server';

import { prisma } from '@/lib/db';
import { uploadImage, FOLDERS } from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { sendPropertySubmissionNotification } from '@/lib/email';

/**
 * Uploads a single image to Cloudinary.
 * Used for sequential uploading from the client to prevent massive payload timeouts.
 */
export async function uploadSingleImage(base64: string) {
  try {
    if (!base64.startsWith('data:')) {
      return { success: false, error: 'Invalid image format. Expected base64 data string.' };
    }
    const url = await uploadImage(base64, FOLDERS.HOUSES);
    return { success: true, url };
  } catch (error: any) {
    console.error('Single image upload failed:', error);
    return { success: false, error: error.message || 'Image upload failed.' };
  }
}

/**
 * Creates a property record. 
 * Resolves the hosting agent from the authenticated session cookie.
 */
async function requireAgent() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { error: 'Not authenticated.' };
  }

  const agent = await prisma.agent.findUnique({
    where: { id: userId },
  });

  if (!agent) {
    return { error: 'Agent not found.' };
  }

  if (agent.role === 'REVOKED') {
    return { error: 'Agent access has been revoked.' };
  }

  return { userId: agent.id };
}

export async function deleteAgentProperty(id: string) {
  try {
    const auth = await requireAgent();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property || property.hostId !== auth.userId) {
      return { success: false, error: 'Not authorized to delete this listing.' };
    }

    await prisma.property.delete({
      where: { id },
    });

    revalidatePath('/dashboard/agent/listings');
    revalidatePath('/dashboard/agent');
    revalidatePath('/properties');
    revalidatePath(`/properties/${id}`);

    return { success: true, property };
  } catch (error: any) {
    console.error('Failed to delete agent property:', error);
    return { success: false, error: error.message || 'Delete failed.' };
  }
}

export async function createProperty(formData: any, imageUrls: string[]) {
  try {
    console.log('Finalizing property publication with', imageUrls.length, 'assets');

    // 1. Resolve Agent from session cookie
    const cookieStore = await cookies();
    const agentId = cookieStore.get('userId')?.value;

    let agent = agentId
      ? await prisma.agent.findUnique({ where: { id: agentId } })
      : null;

    if (!agent) {
      throw new Error('You must be logged in as an agent to post a property.');
    }

    // 2. Insert into Prisma
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
        images: imageUrls,
        hostId: agent.id,
        status: 'PENDING',
        isNew: true, 
      },
    });

    console.log('Asset published successfully:', property.id);

    revalidatePath('/');
    revalidatePath('/properties');
    revalidatePath('/dashboard/agent');
    revalidatePath('/dashboard/agent/listings');
    revalidatePath('/dashboard/admin/approvals');
    revalidatePath('/dashboard/admin/properties');

    try {
      await sendPropertySubmissionNotification(property, { name: agent.name, email: agent.email });
    } catch (error: any) {
      console.error('Property notification email failed:', error);
    }
    
    return { success: true, property };
  } catch (error: any) {
    console.error('Critical failure in publication:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred during publication.' 
    };
  }
}

export async function updateProperty(id: string, formData: any, imageUrls: string[]) {
  try {
    const auth = await requireAgent();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property || property.hostId !== auth.userId) {
      return { success: false, error: 'Not authorized to edit this listing.' };
    }

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
        status: 'PENDING',
        isNew: true,
      },
    });

    revalidatePath('/dashboard/agent/listings');
    revalidatePath('/properties');
    revalidatePath(`/properties/${id}`);

    return { success: true, property: updated };
  } catch (error: any) {
    console.error('Update property failed:', error);
    return { success: false, error: error.message || 'Failed to update property.' };
  }
}
