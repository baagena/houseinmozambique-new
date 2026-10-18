import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.id;

    const body = await request.json();
    const { name, title, location, phone, officeAddress, yearsExperience, bio, specializations } = body;
    const current = await prisma.agent.findUnique({ where: { id: userId }, select: { agencyName: true } });
    const isCorporate = Boolean(current?.agencyName);
    const agencyServices = Array.isArray(body.agencyServices) ? body.agencyServices.map((value: unknown) => String(value).trim()).filter(Boolean).slice(0, 20) : undefined;
    const agencyAreasServed = typeof body.agencyAreasServed === 'string' ? body.agencyAreasServed.split(',').map((value: string) => value.trim()).filter(Boolean).slice(0, 30) : undefined;
    const agencyWebsite = typeof body.agencyWebsite === 'string' ? body.agencyWebsite.trim() : undefined;
    const agencyEmail = typeof body.agencyEmail === 'string' ? body.agencyEmail.trim().toLowerCase() : undefined;
    if (agencyWebsite && (!/^https:\/\//i.test(agencyWebsite) || agencyWebsite.length > 300)) {
      return NextResponse.json({ error: 'Enter a full website address starting with https://.' }, { status: 400 });
    }
    if (agencyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyEmail)) {
      return NextResponse.json({ error: 'Enter a valid public agency email address.' }, { status: 400 });
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: userId },
      data: {
        ...(name && { name, initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) }),
        ...(title && { title }),
        ...(location && { location }),
        ...(phone !== undefined && { phone: String(phone).trim() || null }),
        ...(officeAddress !== undefined && { officeAddress: String(officeAddress).trim() || null }),
        ...(yearsExperience !== undefined && { yearsExperience: Number(yearsExperience) }),
        ...(bio !== undefined && { bio }),
        ...(specializations !== undefined && { specializations }),
        ...(isCorporate && body.agencyBusinessType !== undefined && { agencyBusinessType: String(body.agencyBusinessType).trim() }),
        ...(isCorporate && body.agencyAbout !== undefined && { agencyAbout: String(body.agencyAbout).trim() }),
        ...(isCorporate && agencyServices !== undefined && { agencyServices }),
        ...(isCorporate && agencyAreasServed !== undefined && { agencyAreasServed }),
        ...(isCorporate && agencyWebsite !== undefined && { agencyWebsite: agencyWebsite || null }),
        ...(isCorporate && agencyEmail !== undefined && { agencyEmail: agencyEmail || null }),
      },
      select: {
        id: true,
        name: true,
        initials: true,
        title: true,
        location: true,
        phone: true,
        officeAddress: true,
        bio: true,
        yearsExperience: true,
        specializations: true,
      },
    });

    revalidatePath('/dashboard/agent/profile');
    revalidatePath('/agents');
    revalidatePath(`/agents/${userId}`);

    return NextResponse.json({ agent: updatedAgent, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
