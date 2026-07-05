export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { getAgents, getFeaturedAgents } from '@/lib/data';
import AgentsClient from '@/components/agents/AgentsClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Verified Real Estate Agents in Mozambique',
  description:
    'Browse and connect with verified real estate agents across Mozambique. Find the right local expert for buying, renting, or short stays.',
  path: '/agents',
  keywords: ['real estate agents Mozambique', 'property agents Maputo', 'verified agents Mozambique'],
});

export default async function AgentsPage() {
  const allAgents = await getAgents();
  const featured = await getFeaturedAgents();

  return <AgentsClient featured={featured} allAgents={allAgents} />;
}
