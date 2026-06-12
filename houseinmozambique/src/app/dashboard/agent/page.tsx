import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAgentById } from '@/lib/data';
import { prisma } from '@/lib/db';
import AgentDashboardClient from '@/components/dashboard/AgentDashboardClient';

export default async function AgentDashboard() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) {
    redirect('/auth');
  }

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
