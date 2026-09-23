import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { addonOffers, reserveAddon, type AddonKind } from '@/lib/listing-addons';
import { getPaymentInstructions, hasAnyDestination } from '@/lib/payment-instructions';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET  /api/listings/:id/addons — what can be bought for this listing.
 * POST /api/listings/:id/addons — buy one or both.
 *
 * Buying opens a single Payment covering everything chosen, because an agent
 * ticking two boxes has made one decision and should send one amount against
 * one reference. Two payments would mean two references to quote and two rows
 * for the admin to match against the same M-Pesa statement line.
 *
 * Nothing is switched on here. The add-ons are reserved PENDING and become
 * active when the payment settles, through exactly the same verification the
 * plans go through.
 */

async function ownedListing(id: string, agentId: string) {
  return prisma.property.findFirst({
    where: { id, hostId: agentId },
    select: { id: true, title: true, isFeatured: true, isUrgent: true },
  });
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const property = await ownedListing(id, session.id);
  if (!property) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  const [offers, running, instructions] = await Promise.all([
    addonOffers(),
    prisma.listingAddon.findMany({
      where: { propertyId: id, status: { in: ['PENDING', 'ACTIVE'] } },
      select: { kind: true, status: true, expiresAt: true },
    }),
    getPaymentInstructions(),
  ]);

  return NextResponse.json({
    offers,
    running: running.map((r) => ({
      kind: r.kind,
      status: r.status,
      expiresAt: r.expiresAt?.toISOString() ?? null,
    })),
    destinationConfigured: hasAnyDestination(instructions),
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const property = await ownedListing(id, session.id);
  if (!property) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 });
  }

  const wanted = Array.isArray(body.kinds) ? body.kinds.map(String) : [];
  const offers = await addonOffers();
  const chosen = offers.filter((o) => wanted.includes(o.kind));

  if (chosen.length === 0) {
    return NextResponse.json({ error: 'Choose at least one add-on.' }, { status: 400 });
  }

  /*
   * Already running, or already bought and awaiting payment? Refuse rather
   * than take the money twice. An agent who clicks the button again because
   * the first attempt looked slow must not end up with two references.
   */
  const existing = await prisma.listingAddon.findMany({
    where: { propertyId: id, status: { in: ['PENDING', 'ACTIVE'] } },
    select: { kind: true, status: true },
  });
  const clash = chosen.find((c) => existing.some((e) => e.kind === c.kind));
  if (clash) {
    const state = existing.find((e) => e.kind === clash.kind)!;
    return NextResponse.json(
      {
        error: state.status === 'ACTIVE'
          ? 'That boost is already running on this listing.'
          : 'That boost is already bought and waiting on payment.',
      },
      { status: 409 },
    );
  }

  /*
   * THE PRICE COMES FROM THE PLAN ROW, never from the request. The client
   * sends which add-ons it wants and nothing else — the same rule the plan
   * checkout follows, for the same reason.
   */
  const amountMinor = chosen.reduce((sum, c) => sum + c.priceMinor, 0);
  const currency = chosen[0].currency;

  const orderRef = `HIM-AD${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const payment = await prisma.payment.create({
    data: {
      orderRef,
      amount: amountMinor / 100,
      amountMinor,
      currency,
      method: 'manual',
      // The label the ledger shows. Several add-ons on one payment read as
      // what they are rather than as whichever one happened to be first.
      planType: chosen.length === 1 ? chosen[0].slug : 'addon-bundle',
      planId: chosen[0].planId,
      propertyId: id,
      userId: session.id,
      customerName: session.name ?? 'Unknown Payer',
      customerEmail: session.email,
      status: 'PENDING',
    },
    select: { id: true, orderRef: true, amountMinor: true, currency: true },
  });

  for (const c of chosen) {
    await reserveAddon({
      propertyId: id,
      kind: c.kind as AddonKind,
      planId: c.planId,
      paymentId: payment.id,
    });
  }

  const instructions = await getPaymentInstructions();

  return NextResponse.json(
    {
      success: true,
      paymentId: payment.id,
      orderRef: payment.orderRef,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      bought: chosen.map((c) => c.kind),
      instructions,
      configured: hasAnyDestination(instructions),
      message: 'Boost reserved. It starts once your payment is confirmed.',
    },
    { status: 201 },
  );
}
