import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AGENT_PROFILE_SELECT } from '@/lib/mobile-auth';
import { toPublicProfile } from '@/lib/agent-public-profile';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    select: {
      ...AGENT_PROFILE_SELECT,
      properties: {
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { properties: { where: { status: 'PUBLISHED' } } } },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({ agent: toPublicProfile(agent) });
}
