import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAgent } from '@/lib/mobile-auth';

/**
 * The signed-in agent's own enquiries — the same set the web dashboard shows
 * (src/app/[lang]/dashboard/agent/leads) and the sidebar badge counts.
 *
 * This used to append every unassigned enquiry (agentId null) as well, so each
 * agent saw the whole platform's general contact messages — names, emails and
 * all — and the unread badge counted rows the agent was then refused (403) when
 * marking them read or deleting them, so it could never be cleared. Those
 * messages belong to the admin inbox.
 */
export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const leads = await prisma.inquiry.findMany({
    where: { agentId: auth.agent.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ leads, unreadCount: leads.filter((l) => !l.isRead).length });
}
