import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

async function requireAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return null;
  const agent = await prisma.agent.findUnique({ where: { id: userId }, select: { role: true } });
  return agent?.role === 'ADMIN' ? agent : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
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
  revalidatePath('/');
  return NextResponse.json(ad);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.advertisement.delete({ where: { id } });
  revalidatePath('/');
  return NextResponse.json({ success: true });
}
