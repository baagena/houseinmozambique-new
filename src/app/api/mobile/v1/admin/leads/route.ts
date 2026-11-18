import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';

/**
 * The leads ledger (web: src/app/[lang]/dashboard/admin/leads): every enquiry
 * with its listing and agent, plus the response-time figures. Replying goes to
 * the shared POST /api/admin/inquiries/:id/reply.
 */
export async function GET(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const since = new Date(Date.now() - 30 * 24 * 3_600_000);

  const [inquiries, engagement] = await Promise.all([
    prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true, name: true, email: true, subject: true, message: true, propertyId: true,
        agentId: true, isRead: true, repliedAt: true, createdAt: true,
        agent: { select: { name: true } },
      },
    }),
    prisma.property.aggregate({ _sum: { views: true, contactClicks: true } }),
  ]);

  const propertyIds = [...new Set(inquiries.map((i) => i.propertyId).filter((x): x is string => Boolean(x)))];
  const properties = propertyIds.length
    ? await prisma.property.findMany({ where: { id: { in: propertyIds } }, select: { id: true, title: true } })
    : [];
  const titleById = new Map(properties.map((p) => [p.id, p.title]));

  // Median, not mean: one lead answered a week late would drag an average.
  const responseMinutes = inquiries
    .filter((i) => i.repliedAt)
    .map((i) => (i.repliedAt!.getTime() - i.createdAt.getTime()) / 60000)
    .sort((a, b) => a - b);
  const dayAgo = Date.now() - 24 * 3_600_000;
  const totalViews = engagement._sum.views ?? 0;
  const totalContacts = engagement._sum.contactClicks ?? 0;

  return NextResponse.json({
    leads: inquiries.map((i) => ({
      id: i.id,
      name: i.name,
      email: i.email,
      subject: i.subject,
      message: i.message,
      propertyId: i.propertyId,
      agentId: i.agentId,
      listing: i.propertyId ? (titleById.get(i.propertyId) ?? 'Listing removed') : null,
      agent: i.agent?.name ?? null,
      isRead: i.isRead,
      repliedAt: i.repliedAt?.toISOString() ?? null,
      createdAt: i.createdAt.toISOString(),
    })),
    stats: {
      last30: inquiries.filter((i) => i.createdAt >= since).length,
      medianMinutes: responseMinutes.length ? responseMinutes[Math.floor(responseMinutes.length / 2)] : null,
      unansweredPastDay: inquiries.filter((i) => !i.repliedAt && i.createdAt.getTime() < dayAgo).length,
      contactRate: totalViews > 0 ? (totalContacts / totalViews) * 100 : null,
    },
  });
}
