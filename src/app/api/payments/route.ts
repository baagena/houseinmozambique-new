import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processPayment, convertCurrency } from '@/lib/payment';
import { getSession } from '@/lib/session';

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

    if (!amount || !method || !planType) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, method, or planType' },
        { status: 400 }
      );
    }

    // The amount is still client-supplied, which is not good enough on its own.
    // It cannot be derived server-side yet: PricingPlan stores prices as
    // free-form display strings ("3,000 - 5,000", "Grátis") with no numeric
    // column, so there is nothing authoritative to compare against. Until the
    // pending schema migration adds a numeric price, at least reject values
    // that are not sane positive numbers, and record the payment as PENDING so
    // a human verifies it before anything is granted.
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 10_000_000) {
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!['mpesa', 'emola', 'card', 'manual'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Convert amount to MZN if needed
    let amountInMZN = numericAmount;
    if (currency && currency !== 'MZN') {
      amountInMZN = await convertCurrency(numericAmount, currency, 'MZN');
    }

    // Generate order reference
    const orderRef = `HIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record in database
    // Create payment record in database
    const customerNameSafe = customerName || session.name || 'Unknown Payer';
    const customerEmailSafe = customerEmail || session.email;

    let payment = null;
    try {
      payment = await prisma.payment.create({
        data: {
          orderRef,
          amount: amountInMZN,
          currency: 'MZN',
          method,
          planType,
          userId: resolvedUserId,
          customerName: customerNameSafe,
          customerEmail: customerEmailSafe,
          customerPhone: customerPhone || null,
          transactionId: paymentReference || null,
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

    // If method is manual, do not call external gateway — treat as PENDING and return success
    if (method === 'manual') {
      return NextResponse.json(
        {
          success: true,
          orderRef,
          transactionId: paymentReference || null,
          redirectUrl: null,
          message: 'Payment recorded as manual. Awaiting confirmation.',
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
