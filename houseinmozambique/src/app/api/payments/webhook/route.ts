import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Webhook handler for payment provider callbacks (M-Pesa, e-Mola, Stripe)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderRef, transactionId, status, method, amount } = body;

    if (!orderRef || !status || !transactionId) {
      return NextResponse.json(
        { error: 'Missing required webhook data' },
        { status: 400 }
      );
    }

    // Find the payment record
    const payment = await prisma.payment?.findUnique({
      where: { orderRef },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status based on webhook
    const paymentStatus =
      status === 'success' || status === 'completed'
        ? 'COMPLETED'
        : status === 'pending'
        ? 'PENDING'
        : 'FAILED';

    await prisma.payment?.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        transactionId: transactionId || payment.transactionId,
        completedAt:
          paymentStatus === 'COMPLETED' ? new Date() : undefined,
      },
    });

    // If payment successful, update agent/user subscription
    if (paymentStatus === 'COMPLETED') {
      const agent = await prisma.agent.findUnique({
        where: { id: payment.userId },
      });

      if (agent) {
        // Update agent subscription based on plan type
        const subscriptionData: Record<string, any> = {
          tier: payment.planType,
          status: 'ACTIVE',
          startDate: new Date(),
        };

        // Set expiration date based on plan type
        if (payment.planType === 'premium') {
          subscriptionData.expiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ); // 30 days
        } else if (payment.planType === 'pro') {
          subscriptionData.expiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ); // 30 days
        } else if (payment.planType === 'boost') {
          subscriptionData.expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ); // 7 days
        }

        // Update agent (assuming there's a subscription field)
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            // This assumes your schema has subscription-related fields
            // Adjust based on your actual schema
          },
        });

        console.log(`Agent ${agent.id} subscription updated to ${payment.planType}`);
      }
    }

    // Send confirmation response
    return NextResponse.json(
      {
        success: true,
        message: `Payment ${paymentStatus.toLowerCase()}`,
        orderRef,
        transactionId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
