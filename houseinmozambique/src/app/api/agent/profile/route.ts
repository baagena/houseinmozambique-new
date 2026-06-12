import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, title, location, yearsExperience, bio, specializations } = body;

    const updatedAgent = await prisma.agent.update({
      where: { id: userId },
      data: {
        ...(name && { name, initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) }),
        ...(title && { title }),
        ...(location && { location }),
        ...(yearsExperience !== undefined && { yearsExperience: Number(yearsExperience) }),
        ...(bio !== undefined && { bio }),
        ...(specializations !== undefined && { specializations }),
      },
      select: {
        id: true,
        name: true,
        initials: true,
        title: true,
        location: true,
        bio: true,
        yearsExperience: true,
        specializations: true,
      },
    });

    revalidatePath('/dashboard/agent/profile');
    revalidatePath('/agents');

    return NextResponse.json({ agent: updatedAgent, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
