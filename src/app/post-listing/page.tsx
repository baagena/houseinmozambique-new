import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import PostListingGate from '@/components/listing/PostListingGate';

export const metadata: Metadata = {
  title: 'Post your property',
  description:
    'List a property on House in Mozambique. Sign in or create an account, then answer a few questions and the listing writes itself.',
};

export const dynamic = 'force-dynamic';

/**
 * The front door to posting a listing.
 *
 * Someone who is already signed in has nothing to decide here, so they are sent
 * straight to the guided form — a page that exists only to ask a question you
 * already know the answer to is a page nobody thanks you for.
 *
 * Everyone else is asked the one thing that actually branches: do you have an
 * account already, or are you new? Both answers lead back here, to the same
 * form, via `?redirect=`.
 */
export default async function PostListingPage() {
  const session = await getSession();
  if (session) redirect('/dashboard/agent/new');

  return <PostListingGate />;
}
