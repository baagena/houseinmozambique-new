'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Updates the status of a property. Verifies admin role via session cookie.
 */
export async function updatePropertyStatus(id: string, status: 'PUBLISHED' | 'REJECTED' | 'PENDING') {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return { success: false, error: 'Not authenticated.' };
    }

    const admin = await prisma.agent.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return { success: false, error: 'Forbidden — admins only.' };
    }

    const property = await prisma.property.update({
      where: { id },
      data: { status },
    });

    revalidatePath('/dashboard/admin/approvals');
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
