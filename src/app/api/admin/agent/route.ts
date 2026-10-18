import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { sendAgentWelcomeEmail } from '@/lib/email';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });
    }

    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const accountType = body.accountType === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL';
    const agencyName = String(body.agencyName || '').trim();
    const agencyPhone = String(body.agencyPhone || '').trim();
    const agencyBusinessType = String(body.agencyBusinessType || '').trim();
    const agencyAbout = String(body.agencyAbout || '').trim();
    const agencyServices = toStringArray(body.agencyServices).slice(0, 20);
    const agencyAreasServed = toStringArray(body.agencyAreasServed).slice(0, 30);
    const agencyWebsite = String(body.agencyWebsite || '').trim();
    const agencyEmail = String(body.agencyEmail || '').trim().toLowerCase();
    const phone = String(body.phone || (accountType === 'CORPORATE' ? agencyPhone : '')).trim();
    const location = String(body.location || '').trim();
    const officeAddress = String(body.officeAddress || '').trim();
    const title = String(body.title || '').trim();
    const bio = String(body.bio || '').trim();
    const specializations = toStringArray(body.specializations).slice(0, 20);

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (accountType === 'CORPORATE') {
      if (!agencyName) return NextResponse.json({ error: 'Enter the agency or company name.' }, { status: 400 });
      if (!agencyPhone) return NextResponse.json({ error: 'Enter the agency contact phone.' }, { status: 400 });
      const agencyPhoneDigits = agencyPhone.replace(/\D/g, '');
      if (agencyPhoneDigits.length < 6 || agencyPhoneDigits.length > 20) {
        return NextResponse.json({ error: 'Enter a complete agency contact number with 6 to 20 digits. Include the country code when available.' }, { status: 400 });
      }
    }
    if (agencyWebsite && (!/^https:\/\//i.test(agencyWebsite) || agencyWebsite.length > 300)) {
      return NextResponse.json({ error: 'Enter a website address starting with https://.' }, { status: 400 });
    }
    if (agencyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyEmail)) {
      return NextResponse.json({ error: 'Enter a valid agency email address.' }, { status: 400 });
    }
    if (body.role !== 'ADMIN' && !body.avatar) {
      return NextResponse.json({ error: 'Upload a profile photo before creating this agent.' }, { status: 400 });
    }
    if (accountType === 'INDIVIDUAL' && body.role !== 'ADMIN') {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        return NextResponse.json({ error: 'Enter a full contact phone with country code, for example +258 84 123 4567.' }, { status: 400 });
      }
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
        title: title || 'Real Estate Agent',
        location: location || 'Mozambique',
        phone: phone || null,
        officeAddress: officeAddress || null,
        bio: bio || null,
        avatar: body.avatar ? String(body.avatar).trim() : null,
        yearsExperience: body.yearsExperience !== undefined ? Number(body.yearsExperience) || 0 : 0,
        specializations,
        isFeatured: Boolean(body.isFeatured),
        isVerified: accountType === 'CORPORATE' ? false : body.isVerified !== undefined ? Boolean(body.isVerified) : true,
        role: body.role === 'ADMIN' ? 'ADMIN' : 'AGENT',
        agencyName: accountType === 'CORPORATE' ? agencyName : null,
        agencyPhone: accountType === 'CORPORATE' ? agencyPhone : null,
        agencyBusinessType: accountType === 'CORPORATE' ? agencyBusinessType : null,
        agencyAbout: accountType === 'CORPORATE' ? agencyAbout : null,
        agencyServices: accountType === 'CORPORATE' ? agencyServices : [],
        agencyAreasServed: accountType === 'CORPORATE' ? agencyAreasServed : [],
        agencyWebsite: accountType === 'CORPORATE' ? agencyWebsite || null : null,
        agencyEmail: accountType === 'CORPORATE' ? agencyEmail || null : null,
        corporateStatus: accountType === 'CORPORATE' ? 'PENDING' : null,
        // An account the team creates is vouched for by the team. Without this
        // it could never sign in: login refuses unverified non-admin accounts.
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true, name: true, initials: true, title: true, location: true, phone: true,
        bio: true, avatar: true, yearsExperience: true, rating: true, reviewCount: true, officeAddress: true,
        isFeatured: true, isVerified: true, specializations: true, email: true, role: true,
        isHidden: true, emailVerifiedAt: true,
        agencyName: true, agencyPhone: true, agencyBusinessType: true, agencyAbout: true,
        agencyServices: true, agencyAreasServed: true, agencyWebsite: true, agencyEmail: true, corporateStatus: true,
      },
    });

    revalidatePath('/dashboard/admin/agents');
    revalidatePath('/agents');

    try {
      await sendAgentWelcomeEmail({ name: agent.name, email: agent.email });
    } catch (emailError) {
      console.error('Agent welcome email failed:', emailError);
    }

    return NextResponse.json({ success: true, agent }, { status: 201 });
  } catch (error) {
    console.error('Admin agent create error:', error);
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to create agent.') }, { status: 500 });
  }
}
