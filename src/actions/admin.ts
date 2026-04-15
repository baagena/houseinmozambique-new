'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Updates the status of a property (Admin only).
 * In a real app, we would verify the user's admin role here.
 */
export async function updatePropertyStatus(id: string, status: 'PUBLISHED' | 'REJECTED' | 'PENDING') {
  try {
    const property = await prisma.property.update({
      where: { id },
      data: { status },
    });

    revalidatePath('/dashboard/admin/properties');
    revalidatePath('/properties');
    revalidatePath(`/properties/${id}`);
    revalidatePath('/');

    return { success: true, property };
  } catch (error: any) {
    console.error('Failed to update property status:', error);
    return { success: false, error: error.message || 'Status update failed.' };
  }
}
