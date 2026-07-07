import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAgent } from '@/lib/mobile-auth';

export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const favorites = await prisma.favorite.findMany({
    where: { customerId: auth.agent.id },
    select: { propertyId: true },
  });

  return NextResponse.json({ propertyIds: favorites.map((f) => f.propertyId) });
}

export async function POST(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const propertyId = String(body.propertyId || '').trim();
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId is required.' }, { status: 400 });
  }

  await prisma.favorite.upsert({
    where: { customerId_propertyId: { customerId: auth.agent.id, propertyId } },
    create: { customerId: auth.agent.id, propertyId },
    update: {},
  });

  return NextResponse.json({ success: true });
}
