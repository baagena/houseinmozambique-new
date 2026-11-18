import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireBearerAgent, AGENT_SELF_SELECT } from '@/lib/mobile-auth';
import { parseContactFields } from '@/lib/agent-contact-links';

export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return NextResponse.json({ agent: auth.agent });
}

const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);
const list = (value: unknown, max: number) =>
  (Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [])
    .map((v) => String(v).trim())
    .filter(Boolean)
    .slice(0, max);

/**
 * The app's profile editor — the same fields as the website's
 * (api/agent/profile), including the public contact channels and, for
 * corporate agencies, the business details shown on their profile.
 */
export async function PATCH(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const { name, title, location, yearsExperience, bio, specializations } = body;

  const contact = parseContactFields(body);
  if ('error' in contact) return NextResponse.json({ error: contact.error }, { status: 400 });

  const current = await prisma.agent.findUnique({ where: { id: auth.agent.id }, select: { agencyName: true } });
  const isCorporate = Boolean(current?.agencyName);
  const agencyWebsite = body.agencyWebsite !== undefined ? text(body.agencyWebsite, 300) : undefined;
  const agencyEmail = body.agencyEmail !== undefined ? text(body.agencyEmail, 200).toLowerCase() : undefined;
  if (agencyWebsite && !/^https:\/\//i.test(agencyWebsite)) {
    return NextResponse.json({ error: 'Enter a full website address starting with https://.' }, { status: 400 });
  }
  if (agencyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyEmail)) {
    return NextResponse.json({ error: 'Enter a valid public agency email address.' }, { status: 400 });
  }

  const updatedAgent = await prisma.agent.update({
    where: { id: auth.agent.id },
    data: {
      ...(typeof name === 'string' && name.trim() && {
        name: name.trim(),
        initials: name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      }),
      ...(typeof title === 'string' && title.trim() && { title: title.trim() }),
      ...(typeof location === 'string' && location.trim() && { location: location.trim() }),
      ...(body.phone !== undefined && { phone: text(body.phone, 40) || null }),
      ...(body.officeAddress !== undefined && { officeAddress: text(body.officeAddress, 200) || null }),
      ...(yearsExperience !== undefined && yearsExperience !== null && yearsExperience !== '' && {
        yearsExperience: Math.max(0, Math.min(80, Number(yearsExperience) || 0)),
      }),
      ...(bio !== undefined && { bio: text(bio, 3000) }),
      ...(specializations !== undefined && { specializations: list(specializations, 20) }),
      ...contact.data,
      ...(isCorporate && body.agencyBusinessType !== undefined && { agencyBusinessType: text(body.agencyBusinessType, 120) }),
      ...(isCorporate && body.agencyAbout !== undefined && { agencyAbout: text(body.agencyAbout, 3000) }),
      ...(isCorporate && body.agencyServices !== undefined && { agencyServices: list(body.agencyServices, 20) }),
      ...(isCorporate && body.agencyAreasServed !== undefined && { agencyAreasServed: list(body.agencyAreasServed, 30) }),
      ...(isCorporate && agencyWebsite !== undefined && { agencyWebsite: agencyWebsite || null }),
      ...(isCorporate && agencyEmail !== undefined && { agencyEmail: agencyEmail || null }),
    },
    select: AGENT_SELF_SELECT,
  });

  revalidatePath('/agents');
  revalidatePath(`/agents/${auth.agent.id}`);

  return NextResponse.json({ agent: updatedAgent, message: 'Profile updated successfully' });
}
