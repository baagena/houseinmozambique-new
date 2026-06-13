import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const ad = await prisma.advertisement.update({
      where: { id },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true, clickCount: ad.clickCount });
  } catch (error) {
    console.error('Failed to increment ad click count:', error);
    return NextResponse.json({ error: 'Failed to record click' }, { status: 500 });
  }
}