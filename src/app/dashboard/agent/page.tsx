import { redirect } from 'next/navigation';
import { getAgentById } from '@/lib/data';
import { prisma } from '@/lib/db';
import AgentDashboardClient from '@/components/dashboard/AgentDashboardClient';
import { getSession } from '@/lib/session';

export default async function AgentDashboard() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

  const agent = await getAgentById(agentId);
  
  if (!agent) {
    redirect('/auth');
  }

  const generalInquiries = await prisma.inquiry.findMany({
    where: { agentId: null },
    orderBy: { createdAt: 'desc' },
  });

  const myProperties = agent.properties || [];
  const myInquiries = [...(agent.inquiries || []), ...generalInquiries].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  
  return (
    <AgentDashboardClient 
      agentName={agent.name} 
      myProperties={myProperties} 
      myInquiries={myInquiries} 
    />
  );
}
