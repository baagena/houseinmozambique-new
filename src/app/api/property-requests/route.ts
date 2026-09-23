import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { requestRef, daysFromNow, REQUEST_DAYS } from '@/lib/property-requests';
import { sendRequestReceivedEmail, sendNewRequestAdminEmail } from '@/lib/email';

export const runtime = 'nodejs';

/**
 * POST /api/property-requests — a buyer says what they are looking for.
 *
 * Open to anyone, signed in or not. Requiring an account here would lose most
 * of the people the feature exists for: somebody who wants a three-bedroom in
 * Sommerschield is not going to register first, and the platform gains nothing
 * by making them.
 *
 * Nothing is broadcast on submission. It lands as PENDING and an admin
 * releases it, because the alternative is a form on the open internet that
 * emails every paying agent on the platform — which is a spam cannon with our
 * return address on it.
 */

const MAX_NOTES = 1200;
const INTENTS = ['rent', 'sale', 'short stay'];

/** Centavos from a major-unit string, or null. Money is never a float here. */
function toMinor(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(String(raw).replace(/[^\d.,-]/g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function toInt(raw: unknown): number | null {
  const n = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 });
  }

  const session = await getSession();

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').trim();
  const city = String(body.city ?? '').trim();
  const intent = String(body.intent ?? '').trim();

  if (!name || name.length > 120) {
    return NextResponse.json({ error: 'Tell us your name so an agent knows who they are answering.' }, { status: 400 });
  }
  if (!email.includes('@') || email.length > 200) {
    return NextResponse.json({ error: 'A working email address is how the answers reach you.' }, { status: 400 });
  }
  if (!city) {
    return NextResponse.json({ error: 'Say which city — it is the first thing an agent filters on.' }, { status: 400 });
  }
  if (!INTENTS.includes(intent)) {
    return NextResponse.json({ error: 'Say whether you want to rent, buy, or book a short stay.' }, { status: 400 });
  }

  const budgetMinMinor = toMinor(body.budgetMin);
  const budgetMaxMinor = toMinor(body.budgetMax);

  /*
   * A reversed budget is a typo, not a filter nobody can satisfy. Swapping is
   * kinder than refusing: the person meant a range, and which end they typed
   * first is not information worth a validation error.
   */
  const [minMinor, maxMinor] =
    budgetMinMinor !== null && budgetMaxMinor !== null && budgetMinMinor > budgetMaxMinor
      ? [budgetMaxMinor, budgetMinMinor]
      : [budgetMinMinor, budgetMaxMinor];

  const moveByRaw = String(body.moveBy ?? '').trim();
  const moveBy = moveByRaw ? new Date(moveByRaw) : null;

  try {
    const created = await prisma.propertyRequest.create({
      data: {
        ref: requestRef(),
        requesterId: session?.id ?? null,
        name,
        email,
        phone: phone || null,
        anonymous: Boolean(body.anonymous),
        intent,
        propertyType: String(body.propertyType ?? '').trim() || null,
        city,
        areas: String(body.areas ?? '').trim() || null,
        budgetMinMinor: minMinor,
        budgetMaxMinor: maxMinor,
        currency: body.currency === 'USD' ? 'USD' : 'MZN',
        minBeds: toInt(body.minBeds),
        minBaths: toInt(body.minBaths),
        moveBy: moveBy && !Number.isNaN(moveBy.getTime()) ? moveBy : null,
        notes: String(body.notes ?? '').trim().slice(0, MAX_NOTES) || null,
        status: 'PENDING',
        expiresAt: daysFromNow(REQUEST_DAYS),
      },
      select: { id: true, ref: true, name: true, email: true, city: true, intent: true },
    });

    /*
     * Both emails are best-effort. The requirement is saved; a Resend outage
     * must not come back to the person as "could not submit", because they
     * would fill the form in again and we would have two of them.
     */
    try {
      await sendRequestReceivedEmail({ name: created.name, email: created.email, ref: created.ref });
    } catch (error) {
      console.error(`property-requests: receipt email failed for ${created.ref}`, error);
    }
    try {
      await sendNewRequestAdminEmail({
        ref: created.ref, name: created.name, email: created.email,
        city: created.city, intent: created.intent,
      });
    } catch (error) {
      console.error(`property-requests: admin email failed for ${created.ref}`, error);
    }

    return NextResponse.json({ success: true, ref: created.ref }, { status: 201 });
  } catch (error) {
    console.error('property-requests: create failed', error);
    return NextResponse.json({ error: 'Could not save that request. Please try again.' }, { status: 500 });
  }
}
