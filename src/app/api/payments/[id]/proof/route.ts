import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { uploadImage, FOLDERS } from '@/lib/cloudinary';
import { sendPaymentProofSubmittedEmail } from '@/lib/email';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/payments/:id/proof — the payer says "I've sent it, here's the proof".
 *
 * This is the step that was missing. /api/payments would open a PENDING record
 * with an order reference and then leave the agent with nowhere to put the
 * confirmation code M-Pesa had just texted them, so the reference sat pending
 * forever and the actual handover happened over WhatsApp.
 *
 * What it does NOT do is grant anything. Submitting proof moves the payment to
 * SUBMITTED and nothing else: a claim that money was sent is not money. The
 * grant happens in the admin verify route, once a human has matched the
 * reference against the statement.
 */

/** A screenshot, not a photo album. 6 MB of base64 is ~4.5 MB of image. */
const MAX_PROOF_BYTES = 6 * 1024 * 1024;

/** Reference codes are short. Anything longer is a paste of the whole SMS. */
const MAX_REFERENCE = 64;
const MAX_NOTE = 1000;

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 });
  }

  const payerReference = String(body.payerReference ?? '').trim();
  const payerMsisdn = String(body.payerMsisdn ?? '').trim();
  const proofNote = String(body.proofNote ?? '').trim();
  const proofBase64 = typeof body.proofBase64 === 'string' ? body.proofBase64 : '';

  /*
   * EITHER is enough, but not NEITHER.
   *
   * A reference alone can be looked up on an M-Pesa statement, so requiring a
   * screenshot would block anyone paying from a phone they cannot screenshot
   * on. A screenshot alone shows the amount and the time, which is enough to
   * find the row by hand. An empty submission is just a pending payment with
   * extra steps, and it would fill the verify queue with nothing to verify.
   */
  if (!payerReference && !proofBase64) {
    return NextResponse.json(
      { error: 'Add the confirmation reference or attach a screenshot — either one is enough.' },
      { status: 400 },
    );
  }

  if (payerReference.length > MAX_REFERENCE) {
    return NextResponse.json(
      { error: 'That reference is too long. Send just the confirmation code.' },
      { status: 400 },
    );
  }
  if (proofNote.length > MAX_NOTE) {
    return NextResponse.json({ error: 'That note is too long.' }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id } });

  // Same 404 for "no such payment" and "not yours": telling an unauthorised
  // caller that a reference exists is itself a leak of the ledger.
  if (!payment || payment.userId !== session.id) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  /*
   * A settled payment is closed.
   *
   * Re-submitting against COMPLETED would let a payer overwrite the reference
   * that was verified, which destroys the audit trail for money already
   * granted. REJECTED, on the other hand, must stay open — a rejection is
   * usually a typo in the code, and the fix is to send the right one.
   */
  if (payment.status === 'COMPLETED') {
    return NextResponse.json(
      { error: 'That payment is already confirmed.' },
      { status: 409 },
    );
  }

  let proofUrl = payment.proofUrl;
  if (proofBase64) {
    if (!proofBase64.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'That file could not be read as an image. Attach a screenshot or photo.' },
        { status: 400 },
      );
    }
    if (proofBase64.length > MAX_PROOF_BYTES) {
      return NextResponse.json(
        { error: 'That image is too large. A screenshot under 4 MB is plenty.' },
        { status: 413 },
      );
    }
    try {
      proofUrl = await uploadImage(proofBase64, FOLDERS.PAYMENTS);
    } catch (error) {
      // uploadImage already turns provider errors into something readable.
      const message = error instanceof Error ? error.message : 'Could not upload that screenshot.';
      console.error(`payments/proof: upload failed for payment ${id}`, error);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      payerReference: payerReference || payment.payerReference,
      payerMsisdn: payerMsisdn || payment.payerMsisdn,
      proofNote: proofNote || payment.proofNote,
      proofUrl,
      submittedAt: new Date(),
      /*
       * A resubmission clears the previous verdict.
       *
       * Leaving the old rejection note attached would show the admin a reason
       * that belongs to evidence the payer has already replaced, and show the
       * payer a rejection for a submission they have already corrected.
       */
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: null,
    },
    select: {
      id: true, orderRef: true, status: true, payerReference: true,
      payerMsisdn: true, proofUrl: true, proofNote: true, submittedAt: true,
      amountMinor: true, currency: true, planType: true, method: true,
    },
  });

  /*
   * Tell the team, but never at the cost of the submission.
   *
   * The payer has done their part and the record is already saved; a Resend
   * outage must not come back to them as "could not submit proof", because
   * they would send the money again.
   */
  try {
    await sendPaymentProofSubmittedEmail({
      orderRef: updated.orderRef,
      planType: updated.planType,
      amountMinor: updated.amountMinor,
      currency: updated.currency,
      payerName: payment.customerName,
      payerEmail: payment.customerEmail,
      payerReference: updated.payerReference,
      payerMsisdn: updated.payerMsisdn,
      proofUrl: updated.proofUrl,
      proofNote: updated.proofNote,
    });
  } catch (error) {
    console.error(`payments/proof: admin notification failed for ${updated.orderRef}`, error);
  }

  return NextResponse.json({
    success: true,
    payment: {
      ...updated,
      submittedAt: updated.submittedAt?.toISOString() ?? null,
    },
    message: 'Proof received. The team will confirm it shortly.',
  });
}
