import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

async function requireAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return null;
  const agent = await prisma.agent.findUnique({ where: { id: userId }, select: { role: true } });
  return agent?.role === 'ADMIN' ? agent : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ads = await prisma.advertisement.findMany({ orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }] });
  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
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
  return NextResponse.json(ad);
}
