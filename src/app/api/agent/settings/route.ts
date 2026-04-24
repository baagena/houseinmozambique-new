import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { phone } = body;

    const updatedAgent = await prisma.agent.update({
      where: { id: userId },
      data: {
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({ agent: updatedAgent, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
