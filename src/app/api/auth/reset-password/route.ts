import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const { token, password } = await request.json();
  if (!token || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'A valid token and a password of at least 8 characters are required.' }, { status: 400 });
  }
  const agent = await prisma.agent.findFirst({ where: { passwordResetToken: token, passwordResetExpiresAt: { gt: new Date() } } });
  if (!agent) return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 400 });

  await prisma.agent.update({ where: { id: agent.id }, data: { password: await bcrypt.hash(password, 10), passwordResetToken: null, passwordResetExpiresAt: null } });
  return NextResponse.json({ message: 'Password updated. You can sign in now.' });
}
