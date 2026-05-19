import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processPayment, convertCurrency } from '@/lib/payment';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      amount,
      currency,
      method,
      planType,
      userId,
      customerName,
      customerEmail,
      customerPhone,
    } = body;

    if (!amount || !method || !planType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!['mpesa', 'emola', 'card'].includes(method)) {
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
    const payment = await prisma.payment?.create({
      data: {
        orderRef,
        amount: amountInMZN,
        currency: 'MZN',
        method,
        planType,
        userId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        status: 'PENDING',
      },
    });

    // Process payment based on method
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

    // Update payment record with transaction ID
    if (payment && paymentResponse.transactionId) {
      await prisma.payment?.update({
        where: { id: payment.id },
        data: { transactionId: paymentResponse.transactionId },
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
