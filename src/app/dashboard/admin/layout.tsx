import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/session';

/**
 * Server-side guard for the whole admin console.
 *
 * This exists so an admin page cannot forget its own check. Several pages
 * (agents, properties, content, agents/[id], settings) previously had no
 * server-side check at all: an unauthenticated request rendered every listing
 * on the server and streamed it to the browser before the client-side redirect
 * in the parent layout ever ran.
 *
 * Because this is a Server Component it runs before any child page renders, so
 * new pages added under /dashboard/admin are covered by default.
 *
 * getSession() is memoized per request, so pages that also read the session do
 * not pay a second database round-trip for it.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect('/auth');

  return <>{children}</>;
}
