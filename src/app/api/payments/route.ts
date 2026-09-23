import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processPayment } from '@/lib/payment';
import { getSession } from '@/lib/session';
import { getPaymentInstructions, hasAnyDestination } from '@/lib/payment-instructions';

export async function POST(req: Request) {
  try {
    // Identity comes from the signed session only. The previous version took
    // `userId` straight from the request body, falling back to a hand-rolled
    // regex over the raw Cookie header — either of which let a caller bill a
    // payment to somebody else's account.
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const resolvedUserId = session.id;

    const body = await req.json();
    const {
      amount,
      currency,
      method,
      planType,
      customerName,
      customerEmail,
      customerPhone,
      paymentReference,
    } = body;

    if (!method || !planType) {
      return NextResponse.json(
        { error: 'Missing required fields: method or planType' },
        { status: 400 }
      );
    }

    /*
     * THE PRICE COMES FROM THE PLAN, NOT FROM THE CALLER.
     *
     * This route used to bill whatever `amount` the request body carried,
     * because PricingPlan held prices only as display strings ("3,000 - 5,000",
     * "Grátis") and there was nothing authoritative to check against. Anyone
     * who could post to this endpoint could buy a pro plan for one metical.
     *
     * PricingPlan.priceMinor now holds the real figure in centavos, so the
     * client's `amount` is ignored entirely rather than merely validated —
     * a rule that compares against a number the client also supplies is not a
     * rule. It is still accepted in the body so existing callers do not break,
     * and a mismatch is logged, because a front end quoting a different price
     * from the one being charged is a bug worth seeing.
     */
    const plan = await prisma.pricingPlan.findUnique({
      where: { slug: String(planType) },
      select: { id: true, slug: true, priceMinor: true, currency: true, isActive: true, nameEn: true },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }
    if (!plan.isActive) {
      return NextResponse.json({ error: 'That plan is no longer available' }, { status: 400 });
    }
    if (plan.priceMinor <= 0) {
      // A free plan grants its entitlement directly; it must never open a
      // payment, or the agent waits on a gateway that has nothing to collect.
      return NextResponse.json(
        { error: 'That plan is free — no payment is required' },
        { status: 400 },
      );
    }

    const amountMinor = plan.priceMinor;
    const numericAmount = amountMinor / 100;

    if (amount != null && Math.round(Number(amount) * 100) !== amountMinor) {
      console.warn(
        `payments: client quoted ${amount} for plan "${plan.slug}" but the plan `
        + `charges ${numericAmount}. Charging the plan price.`,
      );
    }

    // Validate payment method
    if (!['mpesa', 'emola', 'card', 'manual'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    /*
     * No conversion. The plan's own currency is what is charged.
     *
     * Converting at checkout meant the amount collected depended on an exchange
     * rate fetched at that second, so two agents on the same plan paid
     * different figures and neither matched the price on the page. Subscription
     * billing is MZN because that is what M-Pesa and eMola settle in; a USD
     * plan would have to be priced in USD deliberately, not converted into one.
     */
    if (currency && currency !== plan.currency) {
      console.warn(`payments: ignoring requested currency ${currency}; plan "${plan.slug}" bills in ${plan.currency}.`);
    }
    const amountInMZN = numericAmount;

    const customerNameSafe = customerName || session.name || 'Unknown Payer';
    const customerEmailSafe = customerEmail || session.email;

    /*
     * ONE OPEN REFERENCE PER PLAN, NOT ONE PER CLICK.
     *
     * This route minted a fresh orderRef on every call, so an agent who opened
     * the billing page twice, or pressed "Choose" again after going to find
     * their phone, ended up with a pile of live references for the same
     * purchase. The ledger filled with "awaiting payment" rows that nobody
     * would ever pay, the badge counted them as work, and worse: the agent
     * could pay against one reference while the billing page was showing them
     * another, so a real payment arrived quoting a reference the page had
     * already replaced.
     *
     * Re-choosing the same plan therefore returns the reference already
     * issued. A row that has proof against it (SUBMITTED) is deliberately not
     * reused — that one is with the team, and handing it back for editing
     * would let the payer change the evidence after it was submitted.
     */
    const reusable = await prisma.payment.findFirst({
      where: { userId: resolvedUserId, planType: String(planType), status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (reusable && method === 'manual') {
      const instructions = await getPaymentInstructions();
      return NextResponse.json(
        {
          success: true,
          reused: true,
          paymentId: reusable.id,
          orderRef: reusable.orderRef,
          amountMinor: reusable.amountMinor,
          currency: reusable.currency,
          status: reusable.status,
          transactionId: null,
          redirectUrl: null,
          instructions,
          configured: hasAnyDestination(instructions),
          message: 'You already have a reference open for this plan.',
        },
        { status: 200 },
      );
    }

    // Generate order reference
    const orderRef = `HIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record in database
    let payment = null;
    try {
      payment = await prisma.payment.create({
        data: {
          orderRef,
          amount: amountInMZN,
          amountMinor,
          currency: plan.currency,
          method,
          planType,
          planId: plan.id,
          userId: resolvedUserId,
          customerName: customerNameSafe,
          customerEmail: customerEmailSafe,
          customerPhone: customerPhone || null,
          /*
           * A reference supplied at checkout is the PAYER'S claim, so it goes
           * in payerReference. transactionId stays reserved for the id a
           * gateway vouched for — conflating the two made a code somebody typed
           * indistinguishable from a settled provider transaction.
           */
          payerReference: paymentReference ? String(paymentReference).trim().slice(0, 64) : null,
          status: 'PENDING',
        },
      });
    } catch (err) {
      console.error('Failed to create payment record:', err);
      // Return DB error message in non-production for debugging
      const message = process.env.NODE_ENV === 'production'
        ? 'Database error creating payment record'
        : err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    /*
     * MANUAL: no gateway to call, so the record is the whole of it.
     *
     * The reference returned here is what the payer writes in the M-Pesa or
     * bank narrative, and `paymentId` is what they post proof against at
     * /api/payments/:id/proof. It used to return neither of those in a usable
     * form — just the orderRef and a message — so the front end had no handle
     * on the row it had opened and the payer had nowhere to put their
     * confirmation code.
     *
     * `instructions` travels with the response rather than being fetched
     * separately so the payer sees the destination in the same moment they are
     * given the reference. Sending them the reference alone is the mistake that
     * produced the WhatsApp-based flow this replaces.
     */
    if (method === 'manual') {
      const instructions = await getPaymentInstructions();
      return NextResponse.json(
        {
          success: true,
          paymentId: payment.id,
          orderRef,
          amountMinor,
          currency: plan.currency,
          status: 'PENDING',
          transactionId: null,
          redirectUrl: null,
          instructions,
          configured: hasAnyDestination(instructions),
          message: hasAnyDestination(instructions)
            ? 'Send the amount to one of the accounts shown, then submit your reference or screenshot.'
            : 'Payment reference created. No payment destination is configured yet — contact the team before sending anything.',
        },
        { status: 201 }
      );
    }

    // Process payment based on method for supported gateways
    const paymentResponse = await processPayment({
      amount: amountInMZN,
      currency: 'MZN',
      method: method as 'mpesa' | 'emola' | 'card',
      description: `House in Mozambique - ${planType} Plan`,
      orderRef,
      customerName,
      customerEmail,
      customerPhone,
      metadata: {
        userId: resolvedUserId,
        planType,
        paymentId: payment?.id,
      },
    });

    if (!paymentResponse.success) {
      return NextResponse.json(paymentResponse, { status: 400 });
    }

    // Update payment record with transaction ID and mark as COMPLETED in dummy mode
    if (payment && paymentResponse.transactionId) {
      await prisma.payment?.update({
        where: { id: payment.id },
        data: { 
          transactionId: paymentResponse.transactionId,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        orderRef,
        transactionId: paymentResponse.transactionId,
        redirectUrl: paymentResponse.redirectUrl,
        message: paymentResponse.message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Payment API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
