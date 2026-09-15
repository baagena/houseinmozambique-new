import { redirect } from 'next/navigation';
import { getAgentById } from '@/lib/data';
import { prisma } from '@/lib/db';
import AgentLeadsClient from '@/components/dashboard/AgentLeadsClient';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AgentLeadsPage() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

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
