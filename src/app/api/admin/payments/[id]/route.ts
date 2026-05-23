import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const admin = await prisma.agent.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });
    }

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
