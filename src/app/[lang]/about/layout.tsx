import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'About Us',
  description:
    'House in Mozambique connects buyers, renters, and travellers with verified local agents and premium property across Mozambique. Learn about our mission and services.',
  path: '/about',
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
