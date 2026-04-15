import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { email },
    });

    if (!agent || agent.password !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return the agent data (excluding password)
    const { password: _, ...agentWithoutPassword } = agent;
    
    // Set a session cookie (simple version)
    const response = NextResponse.json({
      user: agentWithoutPassword,
      message: 'Logged in successfully'
    });

    response.cookies.set('userId', agent.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
