import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AGENT_PROFILE_SELECT } from '@/lib/mobile-auth';
import { toPublicProfile } from '@/lib/agent-public-profile';
import { getDirectoryVisibleWhere } from '@/lib/data';

export async function GET() {
  const agents = await prisma.agent.findMany({
    // Exactly the website's directory (lib/data.ts): agents only, no demo or
    // test accounts, verified emails, and corporate agencies only while their
    // subscription is paid.
    where: getDirectoryVisibleWhere(),
    orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
    select: {
      ...AGENT_PROFILE_SELECT,
      _count: { select: { properties: { where: { status: 'PUBLISHED' } } } },
    },
  });

  return NextResponse.json({ agents: agents.map(toPublicProfile) });
}
