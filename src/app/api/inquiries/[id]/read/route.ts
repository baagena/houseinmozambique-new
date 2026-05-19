import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Only admin or the agent assigned should mark as read. Check agent role or ownership.
    const actor = await prisma.agent.findUnique({ where: { id: userId } });
    if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (actor.role !== 'ADMIN' && inquiry.agentId && inquiry.agentId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.inquiry.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json({ success: true, inquiry: updated });
  } catch (err: any) {
    console.error('API inquiries read error', err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
