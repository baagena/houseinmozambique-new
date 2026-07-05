import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAgent, AGENT_SELF_SELECT } from '@/lib/mobile-auth';

export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: auth.agent.id },
    select: AGENT_SELF_SELECT,
  });

  return NextResponse.json({ agent });
}
