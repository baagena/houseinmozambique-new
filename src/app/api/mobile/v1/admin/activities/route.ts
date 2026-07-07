import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';

export async function GET(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return NextResponse.json({ inquiries });
}
