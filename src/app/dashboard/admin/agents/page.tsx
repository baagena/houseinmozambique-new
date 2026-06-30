import { getAgents } from '@/lib/data';
import AdminAgentsClient, { type AdminAgent } from '@/components/dashboard/AdminAgentsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAgentsPage() {
  const allAgents = await getAgents();

  const agents: AdminAgent[] = allAgents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    initials: agent.initials,
    title: agent.title,
    location: agent.location,
    phone: agent.phone ?? '',
    bio: agent.bio ?? '',
    avatar: agent.avatar ?? '',
    yearsExperience: agent.yearsExperience ?? 0,
    rating: agent.rating ?? 0,
    reviewCount: agent.reviewCount ?? 0,
    isFeatured: agent.isFeatured,
    isVerified: agent.isVerified,
    specializations: agent.specializations ?? [],
    email: agent.email,
    role: agent.role,
    propertyCount: (agent as { _count?: { properties?: number } })._count?.properties ?? 0,
  }));

  return <AdminAgentsClient initialAgents={agents} />;
}
