import { getAgentById } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import AgentListingsTable from '@/components/dashboard/AgentListingsTable';
import { getSession } from '@/lib/session';

export default async function AgentListingsPage() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

  const agent = await getAgentById(agentId);
  
  if (!agent) notFound();
  const myProperties = agent.properties || [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-[#002045] tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>Your Listings</h2>
          <p className="text-xs text-[#74777f] font-medium uppercase tracking-widest mt-1">Manage your architectural portfolio</p>
        </div>
      </div>

      <AgentListingsTable properties={myProperties} />
    </div>
  );
}
