import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireBearerAgent } from '@/lib/mobile-auth';
import { planForNewListing } from '@/lib/entitlements';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Lets an agent or private owner suspend and reactivate their own listing from
 * the mobile app — the same self-service control the web dashboard offers.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.hostId !== auth.agent.id) {
    return NextResponse.json({ error: 'Not authorized to manage this listing.' }, { status: 403 });
  }

  const { action } = await request.json();

  if (!['suspend', 'reactivate', 'sold', 'rented', 'unavailable'].includes(action)) {
    return NextResponse.json(
      { error: 'Choose suspend, reactivate, sold, rented, or unavailable.' },
      { status: 400 }
    );
  }

  if (action === 'reactivate' && !['SUSPENDED', 'SOLD', 'RENTED', 'UNAVAILABLE'].includes(property.status)) {
    return NextResponse.json({ error: 'Only a paused or unavailable listing can be reactivated.' }, { status: 400 });
  }

  if (['sold', 'rented', 'unavailable'].includes(action) && !property.approvedAt) {
    return NextResponse.json({ error: 'Only an approved listing can be marked unavailable.' }, { status: 400 });
  }

  if (action === 'reactivate') {
    const plan = await planForNewListing(property.hostId, auth.agent.role);
    if (!plan.ok) return NextResponse.json({ error: plan.reason || 'Your plan has no room for another live listing.' }, { status: 403 });
  }

  const status = action === 'suspend' ? 'SUSPENDED'
    : action === 'sold' ? 'SOLD'
      : action === 'rented' ? 'RENTED'
        : action === 'unavailable' ? 'UNAVAILABLE'
          : property.approvedAt ? 'PUBLISHED' : 'PENDING';

  const updated = await prisma.property.update({ where: { id }, data: { status } });

  revalidatePath('/dashboard/agent/listings');
  revalidatePath('/properties');
  revalidatePath(`/properties/${id}`);
  revalidatePath('/');

  return NextResponse.json({ success: true, property: updated });
}
