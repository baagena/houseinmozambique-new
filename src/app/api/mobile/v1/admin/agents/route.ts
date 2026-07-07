import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireBearerAdmin, AGENT_SELF_SELECT } from '@/lib/mobile-auth';

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}

export async function GET(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: 'desc' },
    select: { ...AGENT_SELF_SELECT, _count: { select: { properties: true } } },
  });

  return NextResponse.json({ agents });
}

export async function POST(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  const existing = await prisma.agent.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AG';
  const hashedPassword = await bcrypt.hash(password, 10);

  const agent = await prisma.agent.create({
    data: {
      name,
      email,
      password: hashedPassword,
      initials,
      title: String(body.title || 'Agent').trim(),
      location: String(body.location || 'Mozambique').trim(),
      phone: body.phone ? String(body.phone).trim() : null,
      bio: body.bio ? String(body.bio).trim() : null,
      avatar: body.avatar ? String(body.avatar).trim() : null,
      yearsExperience: body.yearsExperience !== undefined ? Number(body.yearsExperience) || 0 : 0,
      specializations: toStringArray(body.specializations),
      isFeatured: Boolean(body.isFeatured),
      isVerified: body.isVerified !== undefined ? Boolean(body.isVerified) : true,
      role: body.role === 'ADMIN' ? 'ADMIN' : 'AGENT',
    },
    select: AGENT_SELF_SELECT,
  });

  return NextResponse.json({ success: true, agent }, { status: 201 });
}
