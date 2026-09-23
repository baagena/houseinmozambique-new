import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { agentsToNotify } from '@/lib/property-requests';
import { sendRequestToAgentEmail } from '@/lib/email';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

function money(minor: number | null, currency: string): string | null {
  if (minor === null) return null;
  return `${new Intl.NumberFormat('en-US').format(Math.round(minor / 100))} ${currency === 'MZN' ? 'MT' : currency}`;
}

function budgetLine(min: number | null, max: number | null, currency: string): string | null {
  const lo = money(min, currency);
  const hi = money(max, currency);
  if (lo && hi) return `${lo} – ${hi}`;
  if (hi) return `up to ${hi}`;
  if (lo) return `from ${lo}`;
  return null;
}

/**
 * POST /api/admin/property-requests/:id — release, reject or close a request.
 *
 * Releasing is the only action that sends anything. It is deliberately a
 * human decision: this endpoint fans a message out to every agent with a live
 * paid plan, and a public form that could trigger that on its own would be a
 * spam cannon with our return address on it.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 });
  }

  const action = String(body.action ?? '');
  if (!['release', 'reject', 'close'].includes(action)) {
    return NextResponse.json({ error: 'action must be release, reject or close' }, { status: 400 });
  }

  const note = String(body.note ?? '').trim().slice(0, 500);
  if (action === 'reject' && !note) {
    return NextResponse.json({ error: 'Say why — it is kept on the record.' }, { status: 400 });
  }

  const request = await prisma.propertyRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  if (action !== 'release') {
    await prisma.propertyRequest.update({
      where: { id },
      data: {
        status: action === 'reject' ? 'REJECTED' : 'CLOSED',
        reviewedBy: admin.name,
        reviewedAt: new Date(),
        reviewNote: note || null,
      },
    });
    revalidatePath('/dashboard/admin/requests');
    return NextResponse.json({ success: true, status: action === 'reject' ? 'REJECTED' : 'CLOSED' });
  }

  /*
   * Already out? Say so and send nothing.
   *
   * Two admins opening the queue at once is ordinary, and a second fan-out
   * would put the same requirement in every agent's inbox twice — the fastest
   * way to teach people to ignore these emails.
   */
  if (request.broadcastAt) {
    return NextResponse.json({
      success: true,
      alreadySent: true,
      status: request.status,
      sentTo: request.broadcastTo,
      message: `That request already went out to ${request.broadcastTo} agent${request.broadcastTo === 1 ? '' : 's'}.`,
    });
  }

  const agents = await agentsToNotify(request.city);

  /*
   * Marked as sent BEFORE the emails go, not after.
   *
   * If the process dies halfway through a fan-out, the alternative ordering
   * re-sends to everybody who already received it. A request that reached
   * some agents and not others is a smaller problem than one that reaches the
   * same agent three times, and the admin can see the count either way.
   */
  await prisma.propertyRequest.update({
    where: { id },
    data: {
      status: 'OPEN',
      reviewedBy: admin.name,
      reviewedAt: new Date(),
      reviewNote: note || null,
      broadcastAt: new Date(),
      broadcastTo: agents.length,
    },
  });

  let sent = 0;
  const failed: string[] = [];
  for (const agent of agents) {
    try {
      await sendRequestToAgentEmail({
        agentName: agent.name,
        agentEmail: agent.email,
        ref: request.ref,
        intent: request.intent,
        city: request.city,
        areas: request.areas,
        budget: budgetLine(request.budgetMinMinor, request.budgetMaxMinor, request.currency),
        beds: request.minBeds,
        notes: request.notes,
      });
      sent++;
    } catch (error) {
      // One dead address must not stop the fan-out.
      failed.push(agent.email);
      console.error(`admin/property-requests: send to ${agent.email} failed`, error);
    }
  }

  revalidatePath('/dashboard/admin/requests');
  revalidatePath('/dashboard/agent/requests');

  return NextResponse.json({
    success: true,
    status: 'OPEN',
    sentTo: sent,
    failed: failed.length,
    message: agents.length === 0
      ? 'Released. No agent has a paid plan right now, so nothing was emailed — it is on their board either way.'
      : `Released and emailed to ${sent} agent${sent === 1 ? '' : 's'}${failed.length ? `, ${failed.length} failed` : ''}.`,
  });
}
