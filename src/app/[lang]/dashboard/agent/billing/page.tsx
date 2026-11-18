import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getAgentBillingView } from '@/lib/agent-billing-view';
import AgentBillingClient from '@/components/dashboard/AgentBillingClient';

export const dynamic = 'force-dynamic';

/**
 * What the agent is paying, what they get for it, and what is due next.
 *
 * Everything on this page was previously invisible to the person paying for it:
 * the payments table existed but only an admin could see it, and what a plan
 * actually granted was not recorded anywhere. An agent could not answer "how
 * many listings do I have left" or "when does this run out" without asking.
 *
 * The data is assembled in src/lib/agent-billing-view.ts, which the mobile app's
 * billing endpoint shares.
 */
export default async function AgentBillingPage({
  searchParams,
}: {
  /** ?plan=<slug> from the public pricing page: that plan is scrolled to and highlighted. */
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: preselect } = await searchParams;
  const session = await getSession();
  if (!session) redirect('/auth');

  const view = await getAgentBillingView(session.id, session.role);

  return (
    <AgentBillingClient
      state={view.state}
      graceDays={view.graceDays}
      subscription={view.subscription}
      instructions={view.instructions}
      destinationConfigured={view.destinationConfigured}
      openPayment={view.openPayment}
      payments={view.payments}
      plans={view.plans}
      preselect={preselect ?? null}
      credits={view.credits}
    />
  );
}
