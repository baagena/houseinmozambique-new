import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processPayment, convertCurrency } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.debug('/api/payments incoming body:', JSON.stringify(body));
    const {
      amount,
      currency,
      method,
      planType,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      paymentReference,
    } = body;

    // Attempt to derive userId from cookies if not provided in body
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      try {
        const cookieHeader = req.headers.get('cookie') || '';
        // If the backend sets a userId cookie, try to parse it from the cookie string
        const match = cookieHeader.match(/userId=([^;\s]+)/);
        if (match) resolvedUserId = decodeURIComponent(match[1]);
      } catch (err) {
        console.warn('Could not parse cookies for userId fallback', err);
      }
    }

    if (!amount || !method || !planType || !resolvedUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, method, planType, or userId' },
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
    let amountInMZN = amount;
    if (currency && currency !== 'MZN') {
      amountInMZN = await convertCurrency(amount, currency, 'MZN');
    }

    // Generate order reference
    const orderRef = `HIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record in database
    // Create payment record in database
    const customerNameSafe = customerName || 'Unknown Payer';
    const customerEmailSafe = customerEmail || 'billing@houseinmoz.com';

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
        userId,
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
