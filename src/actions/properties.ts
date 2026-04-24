'use server';

import { prisma } from '@/lib/db';
import { uploadImage, FOLDERS } from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

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
    
    return { success: true, property };
  } catch (error: any) {
    console.error('Critical failure in publication:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred during publication.' 
    };
  }
}
