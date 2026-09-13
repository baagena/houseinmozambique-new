import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: Request) {
  const { email } = await request.json();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const generic = 'If an account exists for that email, a reset link has been sent.';
  if (!normalizedEmail) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

  const agent = await prisma.agent.findUnique({ where: { email: normalizedEmail } });
  if (!agent) return NextResponse.json({ message: generic });

  const token = randomBytes(32).toString('hex');
  await prisma.agent.update({ where: { id: agent.id }, data: { passwordResetToken: token, passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  try {
    await sendPasswordResetEmail({ name: agent.name, email: agent.email, token });
  } catch (error) {
    console.error('Password reset email failed:', error);
    await prisma.agent.update({
      where: { id: agent.id },
      data: { passwordResetToken: null, passwordResetExpiresAt: null },
    });
    return NextResponse.json(
      { error: 'The reset email could not be sent. Please try again later.' },
      { status: 503 }
    );
  }
  return NextResponse.json({ message: generic });
}
