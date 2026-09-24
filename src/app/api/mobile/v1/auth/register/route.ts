import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendAgentVerificationEmail, sendNewAgentNotificationEmail } from '@/lib/email';
import { signAgentToken, AGENT_SELF_SELECT } from '@/lib/mobile-auth';
import { randomBytes } from 'node:crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, title, location, yearsExperience, bio, specializations } = body;
    const requestedRole = body.accountType || body.role;
    const role =
      requestedRole === 'CUSTOMER' ? 'CUSTOMER' : requestedRole === 'OWNER' ? 'OWNER' : 'AGENT';

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password and name are required' },
        { status: 400 }
      );
    }

    // Current app builds send acceptedTerms: true from a required checkbox.
    // Builds already installed from before the checkbox don't send it, so a
    // missing flag is recorded as "not captured" rather than refused.
    if (body.acceptedTerms !== undefined && body.acceptedTerms !== true) {
      return NextResponse.json(
        { error: 'You must accept the Terms of Service and Privacy Policy' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const existingAgent = await prisma.agent.findUnique({ where: { email } });
    if (existingAgent) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    const verificationToken = randomBytes(32).toString('hex');

    const newAgent = await prisma.agent.create({
      data: {
        email,
        password: hashedPassword,
        name,
        initials,
        phone: phone || null,
        title:
          role === 'CUSTOMER' ? 'Customer' : role === 'OWNER' ? title || 'Property Owner' : title || 'Agent',
        location: location || 'Mozambique',
        yearsExperience: yearsExperience || 0,
        bio: bio || '',
        specializations: specializations || [],
        role,
        emailVerifyToken: verificationToken,
        emailVerifyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        termsAcceptedAt: body.acceptedTerms === true ? new Date() : null,
      },
      select: AGENT_SELF_SELECT,
    });

    if (role === 'AGENT' || role === 'OWNER') {
      try {
        await sendAgentVerificationEmail({
          name: newAgent.name,
          email: newAgent.email,
          token: verificationToken,
        });
        await sendNewAgentNotificationEmail({ name: newAgent.name, email: newAgent.email, role });
      } catch (emailError) {
        console.error('Agent verification email failed:', emailError);
      }
    }

    const token = signAgentToken(newAgent.id, newAgent.role);

    return NextResponse.json({
      token,
      agent: newAgent,
      message: role === 'CUSTOMER'
        ? 'Account created successfully.'
        : 'Agent registered successfully. A verification email has been sent.',
    });
  } catch (error) {
    console.error('Mobile registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
