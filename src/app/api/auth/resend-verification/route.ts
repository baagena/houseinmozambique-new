import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { sendAgentVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  const { email } = await request.json();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const genericMessage = 'If the account exists and still needs verification, a new email has been sent.';

  if (!normalizedEmail) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({ where: { email: normalizedEmail } });
  if (!agent || agent.emailVerifiedAt || agent.role === 'ADMIN') {
    return NextResponse.json({ message: genericMessage });
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.agent.update({
    where: { id: agent.id },
    data: { emailVerifyToken: token, emailVerifyExpiresAt: expiresAt },
  });

  try {
    await sendAgentVerificationEmail({ name: agent.name, email: agent.email, token });
  } catch (error) {
    console.error('Resend verification email failed:', error);
    return NextResponse.json({ error: 'The verification email could not be sent. Please try again later.' }, { status: 503 });
  }

  return NextResponse.json({ message: genericMessage });
}
