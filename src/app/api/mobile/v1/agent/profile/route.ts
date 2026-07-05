import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAgent, AGENT_SELF_SELECT } from '@/lib/mobile-auth';

export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return NextResponse.json({ agent: auth.agent });
}

export async function PATCH(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { name, title, location, yearsExperience, bio, specializations } = body;

  const updatedAgent = await prisma.agent.update({
    where: { id: auth.agent.id },
    data: {
      ...(name && { name, initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) }),
      ...(title && { title }),
      ...(location && { location }),
      ...(yearsExperience !== undefined && { yearsExperience: Number(yearsExperience) }),
      ...(bio !== undefined && { bio }),
      ...(specializations !== undefined && { specializations }),
    },
    select: AGENT_SELF_SELECT,
  });

  return NextResponse.json({ agent: updatedAgent, message: 'Profile updated successfully' });
}
