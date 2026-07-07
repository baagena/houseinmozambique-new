import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin, AGENT_SELF_SELECT } from '@/lib/mobile-auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const agent = await prisma.agent.update({ where: { id }, data: { role: 'REVOKED' }, select: AGENT_SELF_SELECT });
  return NextResponse.json({ success: true, agent });
}
