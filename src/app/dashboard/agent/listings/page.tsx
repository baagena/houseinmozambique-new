import { getAgentById } from '@/lib/data';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import AgentListingsTable from '@/components/dashboard/AgentListingsTable';

export default async function AgentListingsPage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) redirect('/auth');

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
