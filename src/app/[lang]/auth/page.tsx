import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { afterAuth } from '@/lib/after-auth';
import AuthClient from './AuthClient';

export const dynamic = 'force-dynamic';

/**
 * The sign-in page, with a guard in front of it.
 *
 * `/auth?redirect=/post-property&plan=per-house` is a real link — the pricing
 * table hands it out — and somebody already signed in who followed it was
 * shown the sign-in form anyway, asked to prove who they were for a second
 * time, and then sent to the old single-page form rather than the guided one.
 *
 * Two faults, both fixed here rather than in the form: a page that asks a
 * question it already knows the answer to, and a destination we replaced.
 * afterAuth() decides the destination, so the guard and the two handlers
 * inside AuthClient cannot drift apart.
 *
 * `?error=` is the one case that still renders the form while signed in: the
 * verification route sends people back here when a link is stale or reused,
 * and bouncing them to a dashboard would swallow the message telling them why.
 */
export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value ?? null;
  };

  const session = await getSession();
  if (session && !one('error')) {
    redirect(
      afterAuth(one('redirect'), {
        isAdmin: session.role === 'ADMIN',
        plan: one('plan'),
      }),
    );
  }

  return <AuthClient />;
}
