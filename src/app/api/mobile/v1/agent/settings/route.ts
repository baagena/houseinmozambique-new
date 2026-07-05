import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAgent } from '@/lib/mobile-auth';

export async function PATCH(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { phone } = body;

  const updatedAgent = await prisma.agent.update({
    where: { id: auth.agent.id },
    data: {
      ...(phone !== undefined && { phone }),
    },
    select: { id: true, email: true, phone: true },
  });

  return NextResponse.json({ agent: updatedAgent, message: 'Settings updated successfully' });
}
