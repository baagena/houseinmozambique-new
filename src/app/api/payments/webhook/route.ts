import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/db';
import { grantFromPayment } from '@/lib/entitlements';

/**
 * Webhook handler for payment provider callbacks (M-Pesa, e-Mola, Stripe).
 *
 * This endpoint previously accepted `{ orderRef, status, transactionId }` from
 * anyone and would mark the matching payment COMPLETED — no authentication of
 * any kind. Knowing (or guessing) an order reference was enough to grant
 * yourself a paid plan.
 *
 * It now requires an HMAC-SHA256 signature over the exact raw request body,
 * keyed with PAYMENT_WEBHOOK_SECRET (falling back to STRIPE_WEBHOOK_SECRET).
 *
 * It deliberately FAILS CLOSED: if no secret is configured the request is
 * rejected rather than trusted. If a provider integration stops completing
 * payments after this change, the fix is to configure the secret and have the
 * provider sign its callbacks — not to remove this check.
 */

function getWebhookSecret(): string | null {
  return process.env.PAYMENT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || null;
}

/** Constant-time compare that never throws on length mismatch. */
function signatureMatches(expected: string, provided: string): boolean {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    const secret = getWebhookSecret();
    if (!secret) {
      console.error(
        'payments/webhook: PAYMENT_WEBHOOK_SECRET is not configured — rejecting callback. ' +
          'Set it and configure the provider to sign callbacks.'
      );
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    // The signature covers the exact bytes received, so read the body as text
    // and parse it ourselves rather than using req.json().
    const rawBody = await req.text();

    const provided =
      req.headers.get('x-webhook-signature') ||
      req.headers.get('x-signature') ||
      '';

    if (!provided) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!signatureMatches(expected, provided.trim())) {
      console.warn('payments/webhook: signature mismatch — rejecting callback');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
    }

    const orderRef = typeof body.orderRef === 'string' ? body.orderRef : '';
    const transactionId = typeof body.transactionId === 'string' ? body.transactionId : '';
    const status = typeof body.status === 'string' ? body.status : '';

    if (!orderRef || !status || !transactionId) {
      return NextResponse.json({ error: 'Missing required webhook data' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { orderRef } });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const paymentStatus =
      status === 'success' || status === 'completed'
        ? 'COMPLETED'
        : status === 'pending'
        ? 'PENDING'
        : 'FAILED';

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        transactionId: transactionId || payment.transactionId,
        completedAt: paymentStatus === 'COMPLETED' ? new Date() : undefined,
      },
    });

    /*
     * A settled payment now grants what it bought.
     *
     * This used to record the status and stop, because there was no model for
     * what a plan gives you. grantFromPayment() creates the Subscription or the
     * single-listing credit, and is idempotent on paymentId — gateways retry
     * webhooks, and M-Pesa callbacks in particular can arrive twice, so a
     * second delivery must not buy a second month.
     *
     * A failure here is logged and swallowed rather than returned as an error:
     * the money has moved and the gateway needs its 200, or it will keep
     * retrying a callback that has already been recorded. An ungranted
     * settled payment is visible in the admin payments table and can be
     * granted by hand.
     */
    if (paymentStatus === 'COMPLETED') {
      try {
        const granted = await grantFromPayment(payment.id);
        console.log(
          granted
            ? `payments/webhook: payment ${payment.id} (${payment.planType}) settled and granted to ${payment.userId}`
            : `payments/webhook: payment ${payment.id} settled but nothing was granted — check the plan slug`
        );
      } catch (grantError) {
        console.error(`payments/webhook: granting for payment ${payment.id} failed`, grantError);
      }
    }

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
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
