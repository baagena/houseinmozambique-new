import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import SettingsForm from '@/components/dashboard/SettingsForm';

export default async function AgentSettingsPage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) redirect('/auth');

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      email: true,
      phone: true,
    },
  });

  if (!agent) redirect('/auth');

  return <SettingsForm email={agent.email} phone={agent.phone || ''} />;
}
