import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * Server-side guard for the agent workspace. Any signed-in, non-revoked agent
 * may enter; per-record ownership is still enforced by the individual pages and
 * API routes. Mirrors the admin layout so a new agent page is protected by
 * default rather than by remembering to add a check.
 */
export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/auth');

  return <>{children}</>;
}
