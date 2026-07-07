import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendAgentVerificationEmail } from '@/lib/email';
import { signAgentToken, AGENT_SELF_SELECT } from '@/lib/mobile-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, title, location, yearsExperience, bio, specializations } = body;
    const role = body.role === 'CUSTOMER' ? 'CUSTOMER' : 'AGENT';

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password and name are required' },
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

    const newAgent = await prisma.agent.create({
      data: {
        email,
        password: hashedPassword,
        name,
        initials,
        phone: phone || null,
        title: role === 'CUSTOMER' ? 'Customer' : (title || 'Agent'),
        location: location || 'Mozambique',
        yearsExperience: yearsExperience || 0,
        bio: bio || '',
        specializations: specializations || [],
        role,
      },
      select: AGENT_SELF_SELECT,
    });

    if (role === 'AGENT') {
      try {
        await sendAgentVerificationEmail({ name: newAgent.name, email: newAgent.email });
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
