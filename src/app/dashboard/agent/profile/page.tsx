import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import ProfileForm from '@/components/dashboard/ProfileForm';

export default async function AgentProfilePage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) redirect('/auth');

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      name: true,
      initials: true,
      title: true,
      location: true,
      yearsExperience: true,
      bio: true,
      specializations: true,
      avatar: true,
    },
  });

  if (!agent) redirect('/auth');

  return <ProfileForm agent={agent} />;
}
