import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAgent } from '@/lib/mobile-auth';

/** Uploads a guest's on-device favorites the first time they sign in, without clobbering existing ones. */
export async function POST(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const propertyIds = Array.isArray(body.propertyIds)
    ? body.propertyIds.map((id: unknown) => String(id).trim()).filter(Boolean)
    : [];

  if (propertyIds.length > 0) {
    await prisma.favorite.createMany({
      data: propertyIds.map((propertyId: string) => ({ customerId: auth.agent.id, propertyId })),
      skipDuplicates: true,
    });
  }

  const favorites = await prisma.favorite.findMany({
    where: { customerId: auth.agent.id },
    select: { propertyId: true },
  });

  return NextResponse.json({ propertyIds: favorites.map((f) => f.propertyId) });
}
