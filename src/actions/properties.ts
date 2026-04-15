'use server';

import { prisma } from '@/lib/db';
import { uploadImage, FOLDERS } from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';

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
 * Expected image list to be already-uploaded URLs.
 */
export async function createProperty(formData: any, imageUrls: string[]) {
  try {
    console.log('Finalizing property publication with', imageUrls.length, 'assets');

    // 1. Resolve Agent
    // Using a default agent for now. In a real app, this would be the authenticated user's ID.
    let agent = await prisma.agent.findFirst({
      where: { id: 'agent-1' } // Try to use the seeded agent-1 first
    });

    if (!agent) {
      agent = await prisma.agent.findFirst();
    }

    if (!agent) {
      throw new Error('No curator found to host this portfolio. Please register as an agent first.');
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
