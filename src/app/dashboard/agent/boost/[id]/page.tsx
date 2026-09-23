import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAgent } from '@/lib/session';
import { addonOffers } from '@/lib/listing-addons';
import { getPaymentInstructions, hasAnyDestination } from '@/lib/payment-instructions';
import BoostListingClient from '@/components/dashboard/BoostListingClient';

export const dynamic = 'force-dynamic';

/**
 * Buying visibility for one listing.
 *
 * Offered here rather than inside the wizard because the decision needs a fact
 * the wizard cannot have: how the listing is actually doing. The view count is
 * on the page for exactly that reason.
 */
export default async function BoostListingPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const agent = await requireAgent();
  if (!agent) redirect('/auth');

  // Scoped to the owner: a listing id is guessable and a boost is a purchase.
  const listing = await prisma.property.findFirst({
    where: { id, hostId: agent.id },
    select: { id: true, title: true, titlePt: true, views: true },
  });
  if (!listing) notFound();

  const [offers, running, instructions] = await Promise.all([
    addonOffers(),
    prisma.listingAddon.findMany({
      where: { propertyId: id, status: { in: ['PENDING', 'ACTIVE'] } },
      select: { kind: true, status: true, expiresAt: true },
    }),
    getPaymentInstructions(),
  ]);

  return (
    <BoostListingClient
      listingId={listing.id}
      listingTitle={listing.titlePt ?? listing.title}
      views={listing.views ?? 0}
      offers={offers.map((o) => ({
        kind: o.kind,
        nameEn: o.nameEn,
        namePt: o.namePt,
        descriptionEn: o.descriptionEn,
        descriptionPt: o.descriptionPt,
        priceMinor: o.priceMinor,
        currency: o.currency,
        days: o.days,
      }))}
      running={running.map((r) => ({
        kind: r.kind,
        status: r.status,
        expiresAt: r.expiresAt?.toISOString() ?? null,
      }))}
      destinationConfigured={hasAnyDestination(instructions)}
    />
  );
}
