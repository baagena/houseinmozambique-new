import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });

    const agent = await prisma.agent.update({ where: { id }, data: { role: 'REVOKED' } });
    return NextResponse.json({ success: true, agent });
  } catch (err: any) {
    console.error('API admin/agent revoke error', err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
