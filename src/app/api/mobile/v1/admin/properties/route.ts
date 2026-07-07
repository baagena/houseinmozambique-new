import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin, AGENT_PUBLIC_SELECT } from '@/lib/mobile-auth';

export async function GET(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const properties = await prisma.property.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { host: { select: AGENT_PUBLIC_SELECT } },
  });

  return NextResponse.json({ properties });
}
