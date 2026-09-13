import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const allowedEvents = new Set(['contact', 'viewing', 'whatsapp']);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { event } = await request.json();
    if (!allowedEvents.has(event)) {
      return NextResponse.json({ error: 'Invalid engagement event.' }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id }, select: { status: true } });
    if (!property || property.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const data = event === 'viewing'
      ? { viewingClicks: { increment: 1 } }
      : { contactClicks: { increment: 1 } };
    await prisma.property.update({ where: { id }, data });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Property engagement tracking failed:', error);
    return NextResponse.json({ error: 'Could not track engagement.' }, { status: 500 });
  }
}