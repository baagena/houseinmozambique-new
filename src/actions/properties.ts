'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { sendPropertySubmissionNotification } from '@/lib/email';

/**
 * Uploads a single image to Cloudinary.
 * Used for sequential uploading from the client to prevent massive payload timeouts.
 */
export async function uploadSingleImage(base64: string, folder: string = 'houseinmozambique/houses') {
  try {
    if (!base64.startsWith('data:')) {
      return { success: false, error: 'Invalid image format. Expected base64 data string.' };
    }
    
    // Import only on server-side execution
    const { uploadImage } = await import('@/lib/cloudinary');
    const url = await uploadImage(base64, folder);
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

/**
 * Loads a listing and confirms the signed-in agent or private owner owns it.
 * Every self-service listing action goes through here, so one account can never
 * touch another account's portfolio.
 */
async function requireOwnedProperty(id: string) {
  const auth = await requireAgent();
  if ('error' in auth) {
    return { error: auth.error };
  }

  const property = await prisma.property.findUnique({ where: { id } });

  if (!property || property.hostId !== auth.userId) {
    return { error: 'Not authorized to manage this listing.' };
  }

  return { userId: auth.userId, property };
}

function revalidateListing(id: string) {
  revalidatePath('/dashboard/agent');
  revalidatePath('/dashboard/agent/listings');
  revalidatePath('/properties');
  revalidatePath(`/properties/${id}`);
  revalidatePath('/');
}

export async function deleteAgentProperty(id: string) {
  try {
    const owned = await requireOwnedProperty(id);
    if ('error' in owned) {
      return { success: false, error: owned.error };
    }

    await prisma.property.delete({
      where: { id },
    });

    revalidateListing(id);

    return { success: true, property: owned.property };
  } catch (error: any) {
    console.error('Failed to delete agent property:', error);
    return { success: false, error: error.message || 'Delete failed.' };
  }
}

/**
 * Takes a listing off the public site without deleting it. Owners run this
 * themselves — no administrator involvement — and can bring it back later.
 */
export async function suspendAgentProperty(id: string) {
  try {
    const owned = await requireOwnedProperty(id);
    if ('error' in owned) {
      return { success: false, error: owned.error };
    }

    if (owned.property.status === 'SUSPENDED') {
      return { success: true, property: owned.property };
    }

    const property = await prisma.property.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    revalidateListing(id);

    return { success: true, property };
  } catch (error: any) {
    console.error('Failed to suspend agent property:', error);
    return { success: false, error: error.message || 'Suspend failed.' };
  }
}

/**
 * Reverses a suspension. A listing an admin has already approved goes straight
 * back live; one that was never approved returns to the moderation queue.
 */
export async function republishAgentProperty(id: string) {
  try {
    const owned = await requireOwnedProperty(id);
    if ('error' in owned) {
      return { success: false, error: owned.error };
    }

    if (owned.property.status !== 'SUSPENDED') {
      return { success: false, error: 'Only a suspended listing can be reactivated.' };
    }

    const property = await prisma.property.update({
      where: { id },
      data: { status: owned.property.approvedAt ? 'PUBLISHED' : 'PENDING' },
    });

    revalidateListing(id);

    return { success: true, property };
  } catch (error: any) {
    console.error('Failed to republish agent property:', error);
    return { success: false, error: error.message || 'Reactivation failed.' };
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
        tags: formData.tags ?? [],
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
    const owned = await requireOwnedProperty(id);
    if ('error' in owned) {
      return { success: false, error: owned.error };
    }

    const { property } = owned;

    // An already-approved listing stays live when its owner edits it, so updates
    // do not need an administrator. Anything not yet approved keeps waiting, and
    // a suspended listing stays suspended until the owner reactivates it.
    const status =
      property.status === 'SUSPENDED'
        ? 'SUSPENDED'
        : property.approvedAt
        ? 'PUBLISHED'
        : 'PENDING';

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
        status,
        isNew: true,
      },
    });

    revalidateListing(id);

    return { success: true, property: updated };
  } catch (error: any) {
    console.error('Update property failed:', error);
    return { success: false, error: error.message || 'Failed to update property.' };
  }
}
