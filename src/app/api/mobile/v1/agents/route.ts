import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AGENT_PUBLIC_SELECT } from '@/lib/mobile-auth';

export async function GET() {
  const agents = await prisma.agent.findMany({
    // Same two exclusions as the web directory in lib/data.ts: staff and
    // private owners are not for hire, and demo/test accounts are not people.
    where: { role: 'AGENT', isHidden: false },
    orderBy: { rating: 'desc' },
    select: {
      ...AGENT_PUBLIC_SELECT,
      _count: { select: { properties: true } },
    },
  });

  return NextResponse.json({ agents });
}
