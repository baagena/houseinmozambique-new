import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAgent } from '@/lib/session';
import { hasPaidPlan, FREE_TIER_DELAY_HOURS } from '@/lib/property-requests';
import { sendRequestAnsweredEmail } from '@/lib/email';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/property-requests/:id/respond — an agent puts their hand up.
 *
 * Responding is what releases an anonymous buyer's contact details, so it is
 * recorded rather than left to email: the buyer can see who answered, and the
 * reveal is auditable. It is also what tells the buyer somebody is on it,
 * which is the whole reason they filled the form in.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  const agent = await requireAgent();
  if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 });
  }

  const message = String(body.message ?? '').trim().slice(0, 1000);
  const propertyId = String(body.propertyId ?? '').trim() || null;

  const request = await prisma.propertyRequest.findUnique({
    where: { id },
    select: { id: true, ref: true, status: true, name: true, email: true, createdAt: true, expiresAt: true },
  });
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  if (!['OPEN', 'MATCHED'].includes(request.status)) {
    return NextResponse.json({ error: 'That request is closed.' }, { status: 409 });
  }
  if (request.expiresAt && request.expiresAt < new Date()) {
    return NextResponse.json({ error: 'That request has expired.' }, { status: 409 });
  }

  /*
   * The free tier's delay is enforced here as well as in the query.
   *
   * The board hides a fresh request from a free-tier agent, but hiding it in
   * the UI is not the rule — somebody who kept a tab open, or who posts the id
   * directly, would otherwise get in first and the paid plan would be worth
   * nothing. The visible rule and the enforced rule have to be the same rule.
   */
  const paid = await hasPaidPlan(agent.id);
  if (!paid) {
    const openTo = new Date(request.createdAt.getTime() + FREE_TIER_DELAY_HOURS * 3_600_000);
    if (openTo > new Date()) {
      return NextResponse.json(
        {
          error: 'New requests go to agents on a paid plan first. This one opens to you shortly — or upgrade to receive them as they arrive.',
          opensAt: openTo.toISOString(),
        },
        { status: 403 },
      );
    }
  }

  /*
   * A second response from the same agent is an edit, not a new lead — the
   * unique index says so, and upserting keeps it that way rather than failing
   * on a constraint the agent cannot see.
   */
  const existing = await prisma.propertyRequestResponse.findUnique({
    where: { requestId_agentId: { requestId: id, agentId: agent.id } },
    select: { id: true },
  });

  await prisma.propertyRequestResponse.upsert({
    where: { requestId_agentId: { requestId: id, agentId: agent.id } },
    update: { message: message || null, propertyId },
    create: { requestId: id, agentId: agent.id, message: message || null, propertyId },
  });

  // First responder flips it to MATCHED so the admin can see it is being worked.
  if (request.status === 'OPEN') {
    await prisma.propertyRequest.update({ where: { id }, data: { status: 'MATCHED' } });
  }

  // Only the first response tells the buyer; an edit is not news to them.
  if (!existing) {
    try {
      await sendRequestAnsweredEmail({
        name: request.name,
        email: request.email,
        ref: request.ref,
        agentName: agent.name,
        message: message || null,
      });
    } catch (error) {
      console.error(`property-requests/respond: buyer email failed for ${request.ref}`, error);
    }
  }

  revalidatePath('/dashboard/agent/requests');
  revalidatePath('/dashboard/admin/requests');

  return NextResponse.json({
    success: true,
    /* The contact details are now theirs to see — the client refreshes to get
       them rather than having them echoed into this response. */
    revealed: true,
    edited: Boolean(existing),
  });
}
