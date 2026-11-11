import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import ServicesIndexClient from '@/components/services/ServicesIndexClient';

export const metadata: Metadata = buildMetadata({
  title: 'Our Services',
  description:
    'What House in Mozambique does: real estate advertising, on-site property assessment and photography, and a verified directory of agents and commissioners.',
  path: '/services',
  keywords: [
    'property advertising Mozambique',
    'real estate photography Mozambique',
    'list your property Mozambique',
    'real estate agent directory Mozambique',
  ],
});

export default function ServicesPage() {
  return <ServicesIndexClient />;
}
