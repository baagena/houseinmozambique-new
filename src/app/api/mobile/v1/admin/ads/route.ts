import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';

export async function GET(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ads = await prisma.advertisement.findMany({ orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }] });
  return NextResponse.json({ ads });
}

export async function POST(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const ad = await prisma.advertisement.create({
    data: {
      title: body.title,
      description: body.description || null,
      imageUrl: body.imageUrl || null,
      linkUrl: body.linkUrl || null,
      linkText: body.linkText || null,
      position: body.position,
      type: body.type || 'banner',
      bgColor: body.bgColor || '#1a3c5e',
      textColor: body.textColor || '#ffffff',
      accentColor: body.accentColor || '#f4a61d',
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ success: true, ad }, { status: 201 });
}
