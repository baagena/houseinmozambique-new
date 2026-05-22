import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAgentById } from '@/lib/data';
import { prisma } from '@/lib/db';
import AgentLeadsClient from '@/components/dashboard/AgentLeadsClient';

export const dynamic = 'force-dynamic';

export default async function AgentLeadsPage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) {
    redirect('/auth');
  }

  const agent = await getAgentById(agentId);
  
  if (!agent) {
    redirect('/auth');
  }

  const myInquiries = (agent.inquiries || []).map(inq => ({
    id: inq.id,
    name: inq.name,
    subject: inq.subject,
    message: inq.message,
    email: inq.email,
    createdAt: inq.createdAt.toISOString()
  }));

  return <AgentLeadsClient myInquiries={myInquiries} />;
}
