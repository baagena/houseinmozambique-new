import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Verification token is missing.' }, { status: 400 });

  const agent = await prisma.agent.findFirst({ where: { emailVerifyToken: token, emailVerifyExpiresAt: { gt: new Date() } } });
  if (!agent) return NextResponse.json({ error: 'This verification link is invalid or expired.' }, { status: 400 });

  await prisma.agent.update({ where: { id: agent.id }, data: { emailVerifiedAt: new Date(), emailVerifyToken: null, emailVerifyExpiresAt: null } });
  return NextResponse.redirect(new URL('/auth?verified=1', request.url));
}
