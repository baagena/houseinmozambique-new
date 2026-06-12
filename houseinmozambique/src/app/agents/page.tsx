export const dynamic = 'force-dynamic';
import { getAgents, getFeaturedAgents } from '@/lib/data';
import AgentsClient from '@/components/agents/AgentsClient';

export default async function AgentsPage() {
  const allAgents = await getAgents();
  const featured = await getFeaturedAgents();

  return <AgentsClient featured={featured} allAgents={allAgents} />;
}
