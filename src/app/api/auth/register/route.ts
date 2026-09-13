import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendAgentVerificationEmail, sendNewAgentNotificationEmail } from '@/lib/email';
import { randomBytes } from 'node:crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, name, title, location, yearsExperience, bio, specializations } = body;
    const email = String(body.email || '').trim().toLowerCase();
    // Two self-service partitions share this endpoint: professional agents and
    // private owners listing their own property. Both manage only their own listings.
    const role = body.accountType === "OWNER" || body.role === "OWNER" ? "OWNER" : "AGENT";

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

    // Check if user already exists
    const existingAgent = await prisma.agent.findUnique({
      where: { email },
    });

    if (existingAgent) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new Agent
    const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    
    const newAgent = await prisma.agent.create({
      data: {
        email,
        password: hashedPassword,
        name,
        initials,
        title: role === "OWNER" ? (title || "Property Owner") : (title || "Agent"),
        location: location || "Mozambique",
        yearsExperience: role === "OWNER" ? 0 : (yearsExperience || 0),
        bio: bio || "",
        specializations: role === "OWNER" ? [] : (specializations || []),
        role,
        emailVerifyToken: randomBytes(32).toString('hex'),
        emailVerifyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const { password: _, ...agentWithoutPassword } = newAgent;

    try {
      await sendAgentVerificationEmail({
        name: newAgent.name,
        email: newAgent.email,
        token: newAgent.emailVerifyToken || undefined,
      });
    } catch (emailError) {

    await sendNewAgentNotificationEmail({ name: newAgent.name, email: newAgent.email, role }).catch((error) => {
      console.error('New agent admin notification failed:', error);
    });
      console.error('Agent verification email failed:', emailError);
      await prisma.agent.delete({ where: { id: newAgent.id } });
      const message =
        process.env.NODE_ENV === 'development' && emailError instanceof Error
          ? emailError.message
          : 'We could not send the verification email. Please check the email service configuration and try again.';
      return NextResponse.json({ error: message }, { status: 503 });
    }

    return NextResponse.json({
      user: agentWithoutPassword,
      requiresVerification: true,
      message: 'Account created. Check your email and click the verification link before signing in.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
