import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import NewListingWizard from '@/components/dashboard/NewListingWizard';

export const metadata = { title: 'New listing' };

/**
 * The guided listing screen (#view-ag-new in the design preview).
 *
 * The listing itself is composed entirely from what the agent answers, by
 * src/lib/listing-copy.ts — no database read feeds the form. The only query
 * here is the one that decides whether this account is allowed to publish at
 * the end of it.
 */
export default async function NewListingPage() {
  const session = await getSession();
  if (!session) redirect('/auth?redirect=%2Fdashboard%2Fagent%2Fnew');

  /*
   * createProperty() refuses a listing from an agent who has not verified
   * their email. Someone arriving straight from registration has not, so
   * without this they would answer six steps, upload photos, press submit and
   * only then be told. Read it here and say so before they start.
   *
   * Not added to SESSION_SELECT: that type is the shared guard payload and is
   * deliberately narrow.
   */
  const account = await prisma.agent.findUnique({
    where: { id: session.id },
    select: { emailVerifiedAt: true, role: true },
  });

  const needsVerification =
    account?.role !== 'ADMIN' && !account?.emailVerifiedAt;

  return <NewListingWizard needsVerification={needsVerification} email={session.email} />;
}
