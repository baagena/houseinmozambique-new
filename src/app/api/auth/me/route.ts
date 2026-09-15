import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // getSession() returns only identity fields; the dashboard chrome needs a
    // little more, so read the display fields explicitly. Still an allow-list —
    // never a bare findUnique whose result reaches a client component.
    const agent = await prisma.agent.findUnique({
      where: { id: session.id },
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
