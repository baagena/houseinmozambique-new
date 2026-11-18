import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';


/** Sent → its value (empty clears it); not sent → left as it is. */
function optional(body: Record<string, unknown>, key: string): string | null | undefined {
  if (!(key in body)) return undefined;
  const value = body[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const ad = await prisma.advertisement.update({
    where: { id },
    // Only the fields sent are changed: a partial update (e.g. just
    // {isActive}) used to blank the description, image and button.
    data: {
      title: body.title,
      description: optional(body, 'description'),
      imageUrl: optional(body, 'imageUrl'),
      linkUrl: optional(body, 'linkUrl'),
      linkText: optional(body, 'linkText'),
      position: body.position,
      type: body.type,
      bgColor: body.bgColor,
      textColor: body.textColor,
      accentColor: body.accentColor,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
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
