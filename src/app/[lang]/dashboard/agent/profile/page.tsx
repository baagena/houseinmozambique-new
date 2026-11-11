import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import ProfileForm from '@/components/dashboard/ProfileForm';
import { getSession } from '@/lib/session';

export default async function AgentProfilePage() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      name: true,
      initials: true,
      title: true,
      location: true,
      phone: true,
      officeAddress: true,
      yearsExperience: true,
      bio: true,
      specializations: true,
      avatar: true,
      agencyName: true,
      agencyPhone: true,
      agencyBusinessType: true,
      agencyAbout: true,
      agencyServices: true,
      agencyAreasServed: true,
      agencyWebsite: true,
      agencyEmail: true,
    },
  });

  if (!agent) redirect('/auth');

  return <ProfileForm agent={agent} />;
}
