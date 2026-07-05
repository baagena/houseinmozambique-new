import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AGENT_PUBLIC_SELECT } from '@/lib/mobile-auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    select: {
      ...AGENT_PUBLIC_SELECT,
      properties: {
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({ agent });
}
