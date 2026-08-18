import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireBearerAgent } from '@/lib/mobile-auth';

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

  if (action !== 'suspend' && action !== 'reactivate') {
    return NextResponse.json(
      { error: 'action must be "suspend" or "reactivate".' },
      { status: 400 }
    );
  }

  if (action === 'reactivate' && property.status !== 'SUSPENDED') {
    return NextResponse.json({ error: 'Only a suspended listing can be reactivated.' }, { status: 400 });
  }

  const status =
    action === 'suspend' ? 'SUSPENDED' : property.approvedAt ? 'PUBLISHED' : 'PENDING';

  const updated = await prisma.property.update({ where: { id }, data: { status } });

  revalidatePath('/dashboard/agent/listings');
  revalidatePath('/properties');
  revalidatePath(`/properties/${id}`);
  revalidatePath('/');

  return NextResponse.json({ success: true, property: updated });
}
