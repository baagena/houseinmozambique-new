'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

async function requireAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { error: 'Not authenticated.' };
  }

  const admin = await prisma.agent.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Forbidden — admins only.' };
  }

  return { userId };
}

export async function updatePropertyStatus(id: string, status: 'PUBLISHED' | 'REJECTED' | 'PENDING') {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        status,
        // Stamp the first approval so the owner can suspend and re-publish
        // their own listing later without coming back through moderation.
        ...(status === 'PUBLISHED' && { approvedAt: new Date() }),
      },
    });

    revalidatePath('/dashboard/agent/listings');
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

export async function deleteProperty(id: string) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const property = await prisma.property.delete({
      where: { id },
    });

    revalidatePath('/dashboard/admin/approvals');
    revalidatePath('/dashboard/admin/properties');
    revalidatePath('/properties');
    revalidatePath(`/properties/${id}`);
    revalidatePath('/');

    return { success: true, property };
  } catch (error: any) {
    console.error('Failed to delete property:', error);
    return { success: false, error: error.message || 'Delete failed.' };
  }
}

export async function revokeAgentAccess(agentId: string) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: { role: 'REVOKED' },
    });

    revalidatePath('/dashboard/admin/agents');
    revalidatePath('/dashboard/admin');

    return { success: true, agent };
  } catch (error: any) {
    console.error('Failed to revoke agent access:', error);
    return { success: false, error: error.message || 'Revoke failed.' };
  }
}
