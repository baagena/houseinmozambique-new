import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireBearerAdmin, AGENT_SELF_SELECT } from '@/lib/mobile-auth';

interface Params {
  params: Promise<{ id: string }>;
}

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json();

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  if (name !== undefined && !name) {
    return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    data.name = name;
    data.initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AG';
  }
  if (body.title !== undefined) data.title = String(body.title).trim() || 'Agent';
  if (body.location !== undefined) data.location = String(body.location).trim() || 'Mozambique';
  if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
  if (body.bio !== undefined) data.bio = body.bio ? String(body.bio).trim() : null;
  if (body.avatar !== undefined) data.avatar = body.avatar ? String(body.avatar).trim() : null;
  if (body.yearsExperience !== undefined) {
    const years = Number(body.yearsExperience);
    data.yearsExperience = Number.isNaN(years) ? null : years;
  }
  if (body.rating !== undefined) {
    const rating = Number(body.rating);
    if (!Number.isNaN(rating)) data.rating = Math.max(0, Math.min(5, rating));
  }
  if (body.reviewCount !== undefined) {
    const reviews = Number(body.reviewCount);
    if (!Number.isNaN(reviews)) data.reviewCount = Math.max(0, Math.trunc(reviews));
  }
  if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured);
  if (body.isVerified !== undefined) data.isVerified = Boolean(body.isVerified);
  if (body.specializations !== undefined) data.specializations = toStringArray(body.specializations);
  if (body.role !== undefined && (body.role === 'ADMIN' || body.role === 'AGENT')) data.role = body.role;

  if (body.password) {
    const password = String(body.password);
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }
    data.password = await bcrypt.hash(password, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
  }

  const updated = await prisma.agent.update({ where: { id }, data, select: AGENT_SELF_SELECT });
  return NextResponse.json({ success: true, agent: updated });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  if (id === auth.agent.id) {
    return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });
  }

  const propertyCount = await prisma.property.count({ where: { hostId: id } });
  if (propertyCount > 0) {
    return NextResponse.json(
      { error: `This agent has ${propertyCount} listing(s). Reassign or delete them first.` },
      { status: 409 }
    );
  }

  await prisma.agent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
