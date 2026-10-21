import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { sendAgentVerificationEmail } from '@/lib/email';

const PROFILE_SELECT = {
  id: true,
  name: true,
  initials: true,
  email: true,
  role: true,
} as const;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const user = await prisma.agent.findUnique({ where: { id: session.id }, select: PROFILE_SELECT });
  if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid profile data.' }, { status: 400 });
    }
    const name: string | undefined = typeof body.name === 'string' ? body.name.trim() : undefined;
    const email: string | undefined = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (name !== undefined && (!name || name.length > 100)) {
      return NextResponse.json({ error: 'Name must be between 1 and 100 characters.' }, { status: 400 });
    }
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (newPassword && newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
    }

    const account = await prisma.agent.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        emailVerifiedAt: true,
        emailVerifyToken: true,
        emailVerifyExpiresAt: true,
      },
    });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    const emailChanged = email !== undefined && email !== account.email;
    const credentialsChanged = emailChanged || Boolean(newPassword);
    if (credentialsChanged) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, account.password))) {
        return NextResponse.json({ error: 'Enter your current password to change your email or password.' }, { status: 403 });
      }
    }

    if (!name && !emailChanged && !newPassword) {
      return NextResponse.json({ error: 'There are no profile changes to save.' }, { status: 400 });
    }

    if (emailChanged) {
      const emailOwner = await prisma.agent.findUnique({ where: { email: email! }, select: { id: true } });
      if (emailOwner && emailOwner.id !== account.id) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
    }

    const verificationToken = emailChanged ? randomBytes(32).toString('hex') : undefined;
    const updated = await prisma.agent.update({
      where: { id: account.id },
      data: {
        ...(name !== undefined ? {
          name,
          initials: name.split(/\s+/).map((part) => part[0]).join('').toUpperCase().slice(0, 2),
        } : {}),
        ...(emailChanged ? {
          email: email!,
          emailVerifiedAt: null,
          emailVerifyToken: verificationToken,
          emailVerifyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        } : {}),
        ...(newPassword ? { password: await bcrypt.hash(newPassword, 10) } : {}),
      },
      select: PROFILE_SELECT,
    });

    if (emailChanged && verificationToken) {
      try {
        await sendAgentVerificationEmail({ name: updated.name, email: updated.email, token: verificationToken, reason: 'email-change' });
      } catch (emailError) {
        console.error('Profile email verification send failed:', emailError);
        await prisma.agent.updateMany({
          where: { id: account.id, email: updated.email, emailVerifyToken: verificationToken },
          data: {
            email: account.email,
            emailVerifiedAt: account.emailVerifiedAt,
            emailVerifyToken: account.emailVerifyToken,
            emailVerifyExpiresAt: account.emailVerifyExpiresAt,
          },
        });
        const user = await prisma.agent.findUnique({ where: { id: account.id }, select: PROFILE_SELECT });
        return NextResponse.json({
          user,
          error: 'Your name or password was saved, but we could not send a verification email. Your email address was left unchanged.',
        }, { status: 503 });
      }
    }

    return NextResponse.json({
      user: updated,
      message: emailChanged
        ? 'Profile saved. Check your new email address to verify it. Your account role is unchanged.'
        : 'Profile saved. Your account role is unchanged.',
    });
  } catch (error) {
    console.error('Account profile update error:', error);
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === 'P2002') return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    return NextResponse.json({ error: 'Could not update your profile.' }, { status: 500 });
  }
}
