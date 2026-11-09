import { redirect } from 'next/navigation';
import { requireAgent } from '@/lib/session';
import {
  visibleRequests,
  toAgentView,
  hasPaidPlan,
  FREE_TIER_DELAY_HOURS,
} from '@/lib/property-requests';
import AgentRequestsClient from '@/components/dashboard/AgentRequestsClient';

export const dynamic = 'force-dynamic';

/**
 * What buyers are asking for, as work this agent can pick up.
 *
 * The delay for free-tier agents is applied in the query rather than by a
 * scheduled job: a request simply becomes visible once it is old enough, so
 * there is nothing to run and nothing to go wrong.
 */
export default async function AgentRequestsPage() {
  const agent = await requireAgent();
  if (!agent) redirect('/auth');

  const paid = await hasPaidPlan(agent.id);
  const rows = await visibleRequests(agent.id, paid);

  return (
    <AgentRequestsClient
      requests={rows.map((r) => toAgentView(r, agent.id))}
      paid={paid}
      delayHours={FREE_TIER_DELAY_HOURS}
    />
  );
}
