import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAgent } from '@/lib/mobile-auth';
import { listingQuality } from '@/lib/listing-quality';

/**
 * The agent dashboard overview — the same figures as the web overview
 * (src/app/[lang]/dashboard/agent/page.tsx): live and pending listings, views,
 * contact clicks, leads this month, overdue leads, the listings that most need
 * work, and how buyers reached the agent in the last 30 days.
 */
export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const agentId = auth.agent.id;

  const now = Date.now();
  const dayAgo = new Date(now - 24 * 3_600_000);
  const monthAgo = new Date(now - 30 * 24 * 3_600_000);

  const [properties, inquiries, channelMix] = await Promise.all([
    prisma.property.findMany({
      where: { hostId: agentId },
      select: {
        id: true, title: true, titlePt: true, status: true, images: true, views: true, contactClicks: true,
        description: true, price: true, bedrooms: true, bathrooms: true, area: true,
        neighborhood: true, address: true, amenities: true, type: true,
      },
    }),
    prisma.inquiry.findMany({
      where: { agentId },
      select: { isRead: true, repliedAt: true, createdAt: true },
    }),
    prisma.contactEvent.groupBy({
      by: ['channel'],
      where: { agentId, createdAt: { gte: monthAgo } },
      _count: { _all: true },
    }),
  ]);

  const attention = properties
    .map((p) => ({ p, quality: listingQuality(p) }))
    .filter((s) => s.quality.band !== 'good')
    .sort((x, y) => x.quality.score - y.quality.score)
    .slice(0, 5)
    .map(({ p, quality }) => ({
      id: p.id,
      title: p.title,
      titlePt: p.titlePt,
      status: p.status,
      image: p.images?.[0] ?? null,
      score: quality.score,
      band: quality.band,
      missing: quality.missing,
    }));

  return NextResponse.json({
    needsProfilePhoto: auth.agent.role === 'AGENT' && !auth.agent.avatar,
    stats: {
      liveListings: properties.filter((p) => p.status === 'PUBLISHED').length,
      pendingListings: properties.filter((p) => !['PUBLISHED', 'SOLD', 'RENTED', 'UNAVAILABLE'].includes(p.status)).length,
      views: properties.reduce((sum, p) => sum + (p.views ?? 0), 0),
      contactClicks: properties.reduce((sum, p) => sum + (p.contactClicks ?? 0), 0),
      leadsThisMonth: inquiries.filter((i) => i.createdAt >= monthAgo).length,
      overdueLeads: inquiries.filter((i) => !i.isRead && !i.repliedAt && i.createdAt < dayAgo).length,
    },
    attention,
    channels: channelMix
      .map((c) => ({ channel: c.channel, count: c._count._all }))
      .sort((x, y) => y.count - x.count),
  });
}
