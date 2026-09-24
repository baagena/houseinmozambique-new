import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireBearerAgent, AGENT_SELF_SELECT } from '@/lib/mobile-auth';

export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: auth.agent.id },
    select: AGENT_SELF_SELECT,
  });

  return NextResponse.json({ agent });
}

/**
 * Self-service account deletion (required by the App Store for any app that
 * lets people create an account). The password is asked again so a leaked or
 * forgotten-on-a-shared-phone token cannot wipe an account on its own.
 *
 * Removed: the account, its favorites and its listings (listing add-ons,
 * feature picks and contact events cascade from the listing). Detached but
 * kept: contact messages and blog posts it authored, which belong to the
 * other party or the site. Payments are not linked by foreign key and stay
 * as the financial record, as the /delete-account page tells users.
 */
export async function DELETE(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { agent } = auth;

  let body: { password?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body falls through to the password check below.
  }

  const password = typeof body.password === 'string' ? body.password : '';
  if (!password || !(await bcrypt.compare(password, agent.password))) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 });
  }

  if (agent.role === 'ADMIN') {
    return NextResponse.json(
      { error: 'Admin accounts cannot be deleted from the app. Ask another admin to remove it.' },
      { status: 400 }
    );
  }

  const listings = await prisma.property.findMany({ where: { hostId: agent.id }, select: { id: true } });
  const listingIds = listings.map((p) => p.id);

  await prisma.$transaction([
    prisma.favorite.deleteMany({
      where: { OR: [{ customerId: agent.id }, { propertyId: { in: listingIds } }] },
    }),
    prisma.inquiry.updateMany({ where: { agentId: agent.id }, data: { agentId: null } }),
    prisma.blogPost.updateMany({ where: { authorId: agent.id }, data: { authorId: null } }),
    prisma.property.deleteMany({ where: { hostId: agent.id } }),
    prisma.agent.delete({ where: { id: agent.id } }),
  ]);

  return NextResponse.json({ success: true });
}
