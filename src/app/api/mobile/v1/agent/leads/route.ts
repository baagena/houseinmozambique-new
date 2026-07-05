import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAgent } from '@/lib/mobile-auth';

export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [ownInquiries, generalInquiries] = await Promise.all([
    prisma.inquiry.findMany({ where: { agentId: auth.agent.id }, orderBy: { createdAt: 'desc' } }),
    prisma.inquiry.findMany({ where: { agentId: null }, orderBy: { createdAt: 'desc' } }),
  ]);

  const leads = [...ownInquiries, ...generalInquiries].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return NextResponse.json({ leads, unreadCount: leads.filter((l) => !l.isRead).length });
}
