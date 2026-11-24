import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { grantManually } from '@/lib/entitlements';
import { CORPORATE_ACCESS_PLAN_WHERE, TRIAL_NOTE_PREFIX } from '@/lib/corporate-access';

interface Params {
  params: Promise<{ id: string }>;
}

const TRIAL_DAY_CHOICES = [7, 14, 30, 60, 90];

function revalidateAgent(id: string) {
  revalidatePath(`/dashboard/admin/agents/${id}`);
  revalidatePath('/dashboard/admin/agents');
  revalidatePath('/agents');
  revalidatePath(`/agents/${id}`);
}

/**
 * Gives an agent a plan by hand. A single-listing plan (Destaque, Super
 * Destaque) becomes one listing credit; a monthly plan starts or extends the
 * agent's subscription by `months`.
 *
 * For a corporate agency this is also how it is activated: staff verify the
 * agency and start a free trial (`trialDays`) or a subscription period. No
 * payment is asked for first — any payment happens outside the platform and
 * staff simply extend the period here. The agency leaves the directory on its
 * own when the period ends.
 */
export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const planSlug = typeof body.planSlug === 'string' ? body.planSlug : '';
  const months = Math.min(12, Math.max(1, Math.trunc(Number(body.months) || 1)));
  const trialDays = TRIAL_DAY_CHOICES.includes(Number(body.trialDays)) ? Number(body.trialDays) : null;
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';

  const [agent, plan] = await Promise.all([
    prisma.agent.findUnique({ where: { id }, select: { id: true, agencyName: true, corporateStatus: true } }),
    prisma.pricingPlan.findUnique({ where: { slug: planSlug }, select: { kind: true } }),
  ]);
  if (!agent) return NextResponse.json({ error: 'Agent not found.' }, { status: 404 });
  if (!plan || plan.kind === 'addon') return NextResponse.json({ error: 'Choose a plan.' }, { status: 400 });
  const isCorporate = Boolean(agent.corporateStatus || agent.agencyName);
  if (isCorporate && plan.kind !== 'subscription') {
    return NextResponse.json({ error: 'Choose a monthly or annual plan for an agency.' }, { status: 400 });
  }
  if (trialDays && plan.kind !== 'subscription') {
    return NextResponse.json({ error: 'A trial needs a monthly or annual plan.' }, { status: 400 });
  }

  const label = trialDays ? `${TRIAL_NOTE_PREFIX} · ${trialDays} days` : `Granted by ${admin.name}`;
  await grantManually({
    agentId: id,
    planSlug,
    months,
    days: trialDays ?? undefined,
    grantedBy: admin.id,
    note: note ? `${label} · ${note}`.slice(0, 300) : label,
  });

  // Verifying and activating are one step for an agency: it is published for
  // as long as the trial or subscription period runs.
  if (isCorporate && agent.corporateStatus !== 'DEMO') {
    await prisma.agent.update({ where: { id }, data: { corporateStatus: 'ACTIVE', isVerified: true } });
  }

  revalidateAgent(id);
  return NextResponse.json({ success: true });
}

/**
 * Deactivates a corporate agency now, before its period ends: it leaves the
 * public directory and its current trial or subscription stops. Activating it
 * again from the same panel starts a fresh period.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });

  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id }, select: { agencyName: true, corporateStatus: true } });
  if (!agent) return NextResponse.json({ error: 'Agent not found.' }, { status: 404 });
  if (!agent.corporateStatus && !agent.agencyName) {
    return NextResponse.json({ error: 'Only agency accounts can be deactivated here.' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { agentId: id, status: { in: ['ACTIVE', 'GRACE'] }, plan: CORPORATE_ACCESS_PLAN_WHERE },
      data: { status: 'CANCELLED' },
    }),
    prisma.agent.update({ where: { id }, data: { corporateStatus: 'INACTIVE' } }),
  ]);

  revalidateAgent(id);
  return NextResponse.json({ success: true });
}
