import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const admin = await prisma.agent.findUnique({ where: { id: userId } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const agent = await prisma.agent.update({ where: { id }, data: { role: 'REVOKED' } });
    return NextResponse.json({ success: true, agent });
  } catch (err: any) {
    console.error('API admin/agent revoke error', err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
