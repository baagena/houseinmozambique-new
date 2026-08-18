import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AGENT_PUBLIC_SELECT } from '@/lib/mobile-auth';

export async function GET() {
  const agents = await prisma.agent.findMany({
    where: { role: 'AGENT' },
    orderBy: { rating: 'desc' },
    select: {
      ...AGENT_PUBLIC_SELECT,
      _count: { select: { properties: true } },
    },
  });

  return NextResponse.json({ agents });
}
