import { NextResponse } from 'next/server';
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
  return NextResponse.json({ success: true, property });
}
