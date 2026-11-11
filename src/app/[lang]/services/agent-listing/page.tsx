import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import AgentListingServiceClient from '@/components/services/AgentListingServiceClient';

export const metadata: Metadata = buildMetadata({
  title: 'Real Estate Agent & Commissioner Listing',
  description:
    'Get a verified public profile in the House in Mozambique agent directory — linked from every property you advertise, with a dashboard for listings, leads and performance.',
  path: '/services/agent-listing',
  keywords: [
    'real estate agent directory Mozambique',
    'list as an agent Mozambique',
    'verified property agent Maputo',
  ],
});

export default function AgentListingPage() {
  return <AgentListingServiceClient />;
}
