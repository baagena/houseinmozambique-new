import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        initials: true,
        role: true,
        email: true,
        title: true,
        location: true,
        phone: true,
        avatar: true,
        isFeatured: true,
        isVerified: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({ user: agent });
  } catch (error) {
    console.error('/api/auth/me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
