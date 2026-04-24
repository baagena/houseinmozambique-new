import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify admin role
    const admin = await prisma.agent.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden — admins only' }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!['PUBLISHED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const updated = await prisma.property.update({
      where: { id },
      data: { status },
    });

    revalidatePath('/dashboard/admin/approvals');
    revalidatePath('/dashboard/admin/properties');
    revalidatePath('/properties');
    revalidatePath('/');

    return NextResponse.json({ property: updated, message: `Property status updated to ${status}` });
  } catch (error) {
    console.error('Property status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
