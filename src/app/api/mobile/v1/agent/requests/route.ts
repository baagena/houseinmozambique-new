import { NextResponse } from 'next/server';
import { requireBearerAgent } from '@/lib/mobile-auth';
import { visibleRequests, toAgentView, hasPaidPlan, FREE_TIER_DELAY_HOURS } from '@/lib/property-requests';

/**
 * "Buyers looking": the requests this agent may see right now, shaped by the
 * same helpers as the web page (src/app/[lang]/dashboard/agent/requests), so
 * contact details stay hidden until the agent has responded and free-tier
 * agents see requests after the same delay.
 *
 * Responding goes to the shared POST /api/property-requests/:id/respond.
 */
export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const paid = await hasPaidPlan(auth.agent.id);
  const rows = await visibleRequests(auth.agent.id, paid);

  return NextResponse.json({
    requests: rows.map((r) => toAgentView(r, auth.agent.id)),
    paid,
    delayHours: FREE_TIER_DELAY_HOURS,
  });
}
