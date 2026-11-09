import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Delete Your Account',
  description: 'How to request deletion of your House in Mozambique account and data.',
  path: '/delete-account',
});

export default function DeleteAccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
