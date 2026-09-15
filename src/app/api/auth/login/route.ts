import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const { password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { email },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, agent.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (agent.role !== 'ADMIN' && !agent.emailVerifiedAt) {
      return NextResponse.json(
        { error: 'Please verify your email before signing in.', requiresVerification: true },
        { status: 403 }
      );
    }

    // Return the agent data (excluding password)
    const { password: _, ...agentWithoutPassword } = agent;
    
    const response = NextResponse.json({
      user: agentWithoutPassword,
      message: 'Logged in successfully'
    });

    setSessionCookie(response, agent.id);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
