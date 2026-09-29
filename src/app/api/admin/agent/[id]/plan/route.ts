import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { grantManually } from '@/lib/entitlements';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Gives an agent a plan by hand — how plans are sold while online payment is
 * not set up: the agent asks through the contact form, pays however was
 * agreed, and staff record it here. A single-listing plan (Destaque, Super
 * Destaque) becomes one listing credit; a monthly plan starts or extends the
 * agent's subscription by `months`.
 */
export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const planSlug = typeof body.planSlug === 'string' ? body.planSlug : '';
  const months = Math.min(12, Math.max(1, Math.trunc(Number(body.months) || 1)));
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';

  const [agent, plan] = await Promise.all([
    prisma.agent.findUnique({ where: { id }, select: { id: true } }),
    prisma.pricingPlan.findUnique({ where: { slug: planSlug }, select: { kind: true } }),
  ]);
  if (!agent) return NextResponse.json({ error: 'Agent not found.' }, { status: 404 });
  if (!plan || plan.kind === 'addon') return NextResponse.json({ error: 'Choose a plan.' }, { status: 400 });

  await grantManually({
    agentId: id,
    planSlug,
    months,
    grantedBy: admin.id,
    note: note || `Granted by ${admin.name}`,
  });

  revalidatePath(`/dashboard/admin/agents/${id}`);
  return NextResponse.json({ success: true });
}
