import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAgent } from '@/lib/mobile-auth';

interface Params {
  params: Promise<{ propertyId: string }>;
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { propertyId } = await params;

  await prisma.favorite.deleteMany({
    where: { customerId: auth.agent.id, propertyId },
  });

  return NextResponse.json({ success: true });
}
