import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { grantFromPayment } from '@/lib/entitlements';
import { sendPaymentApprovedEmail, sendPaymentRejectedEmail } from '@/lib/email';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/payments/:id/verify — a human settles a manual payment.
 *
 * The counterpart to the gateway webhook, and it does the same two things in
 * the same order: record that the money arrived, then grant what it bought. It
 * reuses grantFromPayment() rather than reimplementing the grant, so a manual
 * payment and a gateway payment produce the identical Subscription or
 * ListingCredit — including the early-renewal rule that extends from the end of
 * the paid period instead of from today.
 *
 * Approving is the only place in this flow where money becomes permission, so
 * it records who decided it and against which figure.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 });
  }

  const action = String(body.action ?? '');
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
  }

  const note = String(body.note ?? '').trim().slice(0, 1000);

  /*
   * A rejection without a reason is not reviewable.
   *
   * The payer has to be told what to fix, or their only move is to send the
   * money a second time. So the reason is required on reject and optional on
   * approve.
   */
  if (action === 'reject' && !note) {
    return NextResponse.json(
      { error: 'Say why it was rejected — the payer is shown this.' },
      { status: 400 },
    );
  }

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  if (payment.status === 'COMPLETED') {
    // Not an error worth failing on: two admins opening the queue at once is
    // ordinary. Report the current state so the UI can just refresh.
    return NextResponse.json(
      { success: true, alreadySettled: true, status: 'COMPLETED', message: 'That payment was already confirmed.' },
    );
  }

  const agent = await prisma.agent.findUnique({
    where: { id: payment.userId },
    select: { id: true, name: true, email: true },
  });

  if (action === 'reject') {
    await prisma.payment.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: admin.name,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    });

    if (agent) {
      try {
        await sendPaymentRejectedEmail({
          name: agent.name,
          email: agent.email,
          orderRef: payment.orderRef,
          reason: note,
        });
      } catch (error) {
        console.error(`admin/verify: rejection email failed for ${payment.orderRef}`, error);
      }
    }

    revalidatePath('/dashboard/admin/payments/verify');
    revalidatePath('/dashboard/admin/payments');
    return NextResponse.json({ success: true, status: 'REJECTED' });
  }

  /*
   * APPROVING.
   *
   * `receivedMinor` lets the admin record what actually landed when it differs
   * from the plan price — a short payment, or a transfer fee taken off the top.
   * It is recorded rather than enforced: refusing to settle a payment that is
   * 50 centavos light would send the admin back to the spreadsheet, which is
   * the behaviour this whole flow exists to replace. The plan price stays in
   * amountMinor untouched, so the gap is visible in the ledger.
   */
  const receivedRaw = body.receivedMinor;
  const receivedMinor =
    typeof receivedRaw === 'number' && Number.isFinite(receivedRaw) && receivedRaw > 0
      ? Math.round(receivedRaw)
      : null;

  const shortfallNote =
    receivedMinor && receivedMinor !== payment.amountMinor
      ? `Received ${(receivedMinor / 100).toFixed(2)} ${payment.currency} against ${(payment.amountMinor / 100).toFixed(2)} expected.`
      : '';

  await prisma.payment.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      reviewedBy: admin.name,
      reviewedAt: new Date(),
      reviewNote: [note, shortfallNote].filter(Boolean).join(' ') || null,
    },
  });

  /*
   * Grant, then report the grant honestly.
   *
   * Unlike the webhook, this caller is a person waiting on an answer, so a
   * failed grant is surfaced instead of swallowed: the payment is settled
   * either way, but the admin needs to know that the plan was not applied so
   * they can fix the plan slug rather than assume the agent is sorted.
   */
  let granted: unknown = null;
  let grantError: string | null = null;
  try {
    granted = await grantFromPayment(id);
  } catch (error) {
    grantError = error instanceof Error ? error.message : String(error);
    console.error(`admin/verify: granting for payment ${id} failed`, error);
  }

  /*
   * A settled payment closes the agent's other open references for the same
   * plan.
   *
   * They are superseded by definition: the plan is paid for. Left PENDING they
   * keep the billing page telling the agent to pay for something they have
   * already bought — which is exactly what it did — and they keep the ledger
   * and the pending badge counting work that does not exist.
   *
   * SUBMITTED rows are left alone. Proof has been sent against those and they
   * are somebody's to review, not ours to quietly cancel.
   */
  const superseded = await prisma.payment.updateMany({
    where: {
      userId: payment.userId,
      planType: payment.planType,
      status: 'PENDING',
      id: { not: id },
    },
    data: {
      status: 'CANCELLED',
      reviewedBy: admin.name,
      reviewedAt: new Date(),
      reviewNote: `Superseded by ${payment.orderRef}, which settled.`,
    },
  });
  if (superseded.count > 0) {
    console.log(
      `admin/verify: closed ${superseded.count} superseded reference(s) for ${payment.userId}`,
    );
  }

  if (agent) {
    try {
      await sendPaymentApprovedEmail({
        name: agent.name,
        email: agent.email,
        orderRef: payment.orderRef,
        planType: payment.planType,
        amountMinor: receivedMinor ?? payment.amountMinor,
        currency: payment.currency,
      });
    } catch (error) {
      console.error(`admin/verify: approval email failed for ${payment.orderRef}`, error);
    }
  }

  revalidatePath('/dashboard/admin/payments/verify');
  revalidatePath('/dashboard/admin/payments');
  revalidatePath('/dashboard/agent/billing');

  return NextResponse.json({
    success: true,
    status: 'COMPLETED',
    granted: Boolean(granted),
    grantError,
    message: granted
      ? 'Payment confirmed and the plan applied.'
      : grantError
        ? `Payment confirmed, but the plan was not applied: ${grantError}`
        : `Payment confirmed, but nothing was granted — check that the plan "${payment.planType}" still exists.`,
  });
}
