import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { draftingAvailable } from '@/lib/listing-draft';
import ComposeListingClient from '@/components/dashboard/ComposeListingClient';

export const metadata = { title: 'Compose a listing' };

export default async function ComposeListingPage() {
  const session = await getSession();
  if (!session) redirect('/auth');

  // Read on the server so the page can say plainly that drafting is off,
  // rather than letting the agent write a paragraph and then fail.
  return <ComposeListingClient draftingEnabled={draftingAvailable()} />;
}
