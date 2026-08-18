import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAgent } from '@/lib/admin-guard';

interface Params {
  params: Promise<{ id: string }>;
}

/** Toggle a subscriber between active and opted-out. */
export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdminAgent();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { isActive } = await request.json();

  const subscriber = await prisma.subscriber.update({
    where: { id },
    data: {
      isActive: Boolean(isActive),
      unsubscribedAt: isActive ? null : new Date(),
    },
  });

  return NextResponse.json({
    ...subscriber,
    createdAt: subscriber.createdAt.toISOString(),
    updatedAt: subscriber.updatedAt.toISOString(),
    lastEmailedAt: subscriber.lastEmailedAt?.toISOString() ?? null,
    unsubscribedAt: subscriber.unsubscribedAt?.toISOString() ?? null,
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdminAgent();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.subscriber.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
