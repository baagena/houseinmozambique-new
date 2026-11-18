import { NextResponse } from 'next/server';
import { requireBearerAgent } from '@/lib/mobile-auth';
import { getAgentBillingView } from '@/lib/agent-billing-view';

/**
 * The agent's plan, usage, open payment and history — the same view the web
 * billing page renders (src/lib/agent-billing-view.ts).
 *
 * Choosing a plan posts to the shared POST /api/payments, and proof goes to
 * POST /api/payments/:id/proof; both accept the app's bearer token.
 */
export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  return NextResponse.json(await getAgentBillingView(auth.agent.id, auth.agent.role));
}
