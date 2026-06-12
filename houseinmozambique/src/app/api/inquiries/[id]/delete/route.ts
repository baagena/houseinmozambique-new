import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const actor = await prisma.agent.findUnique({ where: { id: userId } });
    if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // admin can delete any; agent can delete only their own assigned inquiries
    if (actor.role !== 'ADMIN' && inquiry.agentId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.inquiry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API inquiries delete error', err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
