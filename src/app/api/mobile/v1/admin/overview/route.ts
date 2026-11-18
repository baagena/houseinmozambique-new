import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';
import { getPlatformStats } from '@/lib/data';

/**
 * The admin overview's headline numbers and the work queues behind the web
 * sidebar badges, in one call (web: src/app/[lang]/dashboard/admin/page.tsx and
 * /api/dashboard/nav-counts).
 */
export async function GET(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [stats, listingViews, totalProperties, approvals, unreadMessages, subscribers,
    pendingPayments, paymentsToVerify, requestsToRelease, recentInquiries] = await Promise.all([
    getPlatformStats(),
    prisma.property.aggregate({ _sum: { views: true } }),
    prisma.property.count(),
    prisma.property.count({ where: { status: 'PENDING' } }),
    prisma.inquiry.count({ where: { isRead: false } }),
    prisma.subscriber.count({ where: { isActive: true } }),
    prisma.payment.count({ where: { status: { in: ['PENDING', 'SUBMITTED'] } } }),
    prisma.payment.count({ where: { status: 'SUBMITTED' } }),
    prisma.propertyRequest.count({ where: { status: 'PENDING' } }),
    prisma.inquiry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, subject: true, isRead: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    stats: {
      publishedListings: stats.propertyCount,
      totalListings: totalProperties,
      agents: stats.agentCount,
      inquiries: stats.totalInquiries,
      listingViews: listingViews._sum.views ?? 0,
      subscribers,
    },
    counts: {
      approvals,
      unreadMessages,
      pendingPayments,
      paymentsToVerify,
      requestsToRelease,
    },
    recentInquiries,
  });
}
