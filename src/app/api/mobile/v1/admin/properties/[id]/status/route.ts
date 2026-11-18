import { NextResponse } from 'next/server';
import { activateRequestedPlan } from '@/lib/plan-requests';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';
import { sendPropertyApprovedEmail, sendPropertyRejectedEmail } from '@/lib/email';
import { pushListingDecision } from '@/lib/push';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Approve / reject / change a listing's status from the app's admin console —
 * the same outcome as the website's POST /api/admin/property/:id/status.
 *
 * This used to update the row and stop there: the owner was never emailed
 * when a listing was approved or rejected from the app (the website emails
 * them), and an unknown id surfaced as a 500.
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const { status } = await request.json().catch(() => ({ status: null }));

  if (!['PUBLISHED', 'REJECTED', 'PENDING', 'SOLD', 'RENTED', 'UNAVAILABLE'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const existing = await prisma.property.findUnique({ where: { id }, include: { host: true } });
  if (!existing) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

  const property = await prisma.property.update({
    where: { id },
    data: { status, ...(status === 'PUBLISHED' && { approvedAt: new Date() }) },
  });

  // Approving a listing that asked for a paid plan activates that plan.
  if (status === 'PUBLISHED') {
    await activateRequestedPlan(id, auth.agent.id).catch((e) => console.error('activateRequestedPlan failed:', e));
  }

  if (existing.status !== status && (status === 'PUBLISHED' || status === 'REJECTED')) {
    try {
      const notify = status === 'PUBLISHED' ? sendPropertyApprovedEmail : sendPropertyRejectedEmail;
      await notify(property, { name: existing.host.name, email: existing.host.email });
    } catch (error) {
      console.error('Property status notification email failed:', error);
    }
  }
  pushListingDecision(existing.hostId, existing.title, existing.status, status);

  return NextResponse.json({ success: true, property });
}
