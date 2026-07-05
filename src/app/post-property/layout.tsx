import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Post a Property',
  description:
    'List your property on House in Mozambique. Register as an agent, choose a plan, and reach buyers and renters across the country.',
  path: '/post-property',
});

export default function PostPropertyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
