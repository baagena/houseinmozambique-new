import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

interface Params {
  params: Promise<{ id: string }>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });

    const { id } = await params;
    const { status } = await request.json();

    if (!['PENDING', 'COMPLETED', 'FAILED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/admin/approvals');
    revalidatePath('/dashboard/admin/properties');

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Admin payment update error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to update payment.') },
      { status: 500 }
    );
  }
}
