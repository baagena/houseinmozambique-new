import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { error: 'Not authenticated', status: 401 as const };
  }

  const admin = await prisma.agent.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Forbidden - admins only', status: 403 as const };
  }

  return { ok: true as const };
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}

// POST — create a new agent (admin-provisioned).
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
      select: {
        id: true, name: true, initials: true, title: true, location: true, phone: true,
        bio: true, avatar: true, yearsExperience: true, rating: true, reviewCount: true,
        isFeatured: true, isVerified: true, specializations: true, email: true, role: true,
      },
    });

    revalidatePath('/dashboard/admin/agents');
    revalidatePath('/agents');

    return NextResponse.json({ success: true, agent }, { status: 201 });
  } catch (error) {
    console.error('Admin agent create error:', error);
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to create agent.') }, { status: 500 });
  }
}
