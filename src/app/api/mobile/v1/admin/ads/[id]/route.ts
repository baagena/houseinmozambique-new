import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json();

  const ad = await prisma.advertisement.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
      linkUrl: body.linkUrl ?? null,
      linkText: body.linkText ?? null,
      position: body.position,
      type: body.type,
      bgColor: body.bgColor,
      textColor: body.textColor,
      accentColor: body.accentColor,
      isActive: body.isActive,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ success: true, ad });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  await prisma.advertisement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
