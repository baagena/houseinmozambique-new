import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Pricing & Plans for Agents',
  description:
    'Choose a plan to advertise your property listings on House in Mozambique. Reach buyers, renters, and travellers searching for property across Mozambique.',
  path: '/pricing',
  keywords: ['real estate advertising Mozambique', 'agent listing plans', 'property marketing Mozambique'],
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
