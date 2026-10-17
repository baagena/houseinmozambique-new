import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import SettingsForm from '@/components/dashboard/SettingsForm';
import { getSession } from '@/lib/session';

export default async function AgentSettingsPage() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      phone: true,
    },
  });

  if (!agent) redirect('/auth');

  return <SettingsForm phone={agent.phone || ''} />;
}
