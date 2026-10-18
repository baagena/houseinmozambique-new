import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

interface Params {
  params: Promise<{ id: string }>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}


function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const accountType = body.accountType === 'CORPORATE' ? 'CORPORATE' : body.accountType === 'INDIVIDUAL' ? 'INDIVIDUAL' : undefined;

    const name = body.name !== undefined ? String(body.name).trim() : undefined;
    if (name !== undefined && !name) {
      return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (accountType) {
      const current = await prisma.agent.findUnique({ where: { id }, select: { corporateStatus: true } });
      if (!current) return NextResponse.json({ error: 'Agent not found.' }, { status: 404 });
      if (accountType === 'CORPORATE') {
        const agencyName = String(body.agencyName || '').trim();
        const agencyPhone = String(body.agencyPhone || '').trim();
        const agencyBusinessType = String(body.agencyBusinessType || '').trim();
        const agencyAbout = String(body.agencyAbout || '').trim();
        const agencyServices = toStringArray(body.agencyServices) ?? [];
        const agencyAreasServed = toStringArray(body.agencyAreasServed) ?? [];
        const agencyWebsite = String(body.agencyWebsite || '').trim();
        const agencyEmail = String(body.agencyEmail || '').trim().toLowerCase();
        if (!agencyName) return NextResponse.json({ error: 'Enter the agency or company name.' }, { status: 400 });
        if (!agencyPhone) return NextResponse.json({ error: 'Enter the agency contact phone.' }, { status: 400 });
        const agencyPhoneDigits = agencyPhone.replace(/\D/g, '');
        if (agencyPhoneDigits.length < 6 || agencyPhoneDigits.length > 20) {
          return NextResponse.json({ error: 'Enter a complete agency contact number with 6 to 20 digits. Include the country code when available.' }, { status: 400 });
        }
        if (agencyWebsite && (!/^https:\/\//i.test(agencyWebsite) || agencyWebsite.length > 300)) {
          return NextResponse.json({ error: 'Enter a website address starting with https://.' }, { status: 400 });
        }
        if (agencyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyEmail)) {
          return NextResponse.json({ error: 'Enter a valid agency email address.' }, { status: 400 });
        }
        Object.assign(data, {
          agencyName, agencyPhone, agencyBusinessType, agencyAbout, agencyServices, agencyAreasServed,
          agencyWebsite: agencyWebsite || null, agencyEmail: agencyEmail || null,
          corporateStatus: current.corporateStatus || 'PENDING',
        });
      } else {
        Object.assign(data, {
          agencyName: null, agencyPhone: null, agencyBusinessType: null, agencyAbout: null,
          agencyServices: [], agencyAreasServed: [], agencyWebsite: null, agencyEmail: null,
          corporateStatus: null,
        });
      }
    }
    if (name !== undefined) {
      data.name = name;
      data.initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AG';
    }
    if (body.title !== undefined) data.title = String(body.title).trim() || 'Agent';
    if (body.location !== undefined) data.location = String(body.location).trim() || 'Mozambique';
    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
    if (body.officeAddress !== undefined) data.officeAddress = body.officeAddress ? String(body.officeAddress).trim() : null;
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
    /* Keeps demo, test and store-review accounts out of the public directory
       without disabling them. Admin-set only — never a self-service field. */
    if (body.isHidden !== undefined) data.isHidden = Boolean(body.isHidden);
    /* Lets staff confirm an email by hand (or undo it) for an agent who never
       clicked the link — unverified agents cannot sign in. */
    if (body.emailVerified !== undefined) data.emailVerifiedAt = body.emailVerified ? new Date() : null;
    if (body.specializations !== undefined) data.specializations = toStringArray(body.specializations);
    if (body.role !== undefined && (body.role === 'ADMIN' || body.role === 'AGENT')) data.role = body.role;

    // Optional password reset.
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

    const updated = await prisma.agent.update({
      where: { id },
      data,
      select: {
        id: true, name: true, initials: true, title: true, location: true, phone: true, officeAddress: true,
        bio: true, avatar: true, yearsExperience: true, rating: true, reviewCount: true,
        isFeatured: true, isVerified: true, specializations: true, email: true, role: true,
        isHidden: true, emailVerifiedAt: true,
        agencyName: true, agencyPhone: true, agencyBusinessType: true, agencyAbout: true,
        agencyServices: true, agencyAreasServed: true, agencyWebsite: true, agencyEmail: true, corporateStatus: true,
      },
    });

    revalidatePath('/dashboard/admin/agents');
    revalidatePath('/agents');
    revalidatePath('/');

    return NextResponse.json({ success: true, agent: updated });
  } catch (error) {
    console.error('Admin agent edit error:', error);
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to update agent.') }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await requireAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });
    }

    const { id } = await params;

    if (id === auth.id) {
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

    revalidatePath('/dashboard/admin/agents');
    revalidatePath('/agents');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin agent delete error:', error);
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to delete agent.') }, { status: 500 });
  }
}
