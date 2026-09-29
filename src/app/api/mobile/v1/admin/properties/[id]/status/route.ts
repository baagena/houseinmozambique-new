import { NextResponse } from 'next/server';
import { activateRequestedPlan } from '@/lib/plan-requests';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const { status } = await request.json();

  if (!['PUBLISHED', 'REJECTED', 'PENDING'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const property = await prisma.property.update({
    where: { id },
    data: { status, ...(status === 'PUBLISHED' && { approvedAt: new Date() }) },
  });

  // Approving a listing that asked for a paid plan activates that plan.
  if (status === 'PUBLISHED') {
    await activateRequestedPlan(id, auth.agent.id).catch((e) => console.error('activateRequestedPlan failed:', e));
  }
  return NextResponse.json({ success: true, property });
}
