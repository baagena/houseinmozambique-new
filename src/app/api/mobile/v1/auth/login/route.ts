import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signAgentToken, AGENT_SELF_SELECT } from '@/lib/mobile-auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({ where: { email } });

    if (!agent) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, agent.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (agent.role === 'REVOKED') {
      return NextResponse.json({ error: 'This account has been revoked.' }, { status: 403 });
    }

    const token = signAgentToken(agent.id, agent.role);
    const safeAgent = await prisma.agent.findUnique({
      where: { id: agent.id },
      select: AGENT_SELF_SELECT,
    });

    return NextResponse.json({
      token,
      agent: safeAgent,
      message: 'Logged in successfully',
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
