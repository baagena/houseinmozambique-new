import { redirect } from 'next/navigation';
import { getAgentById } from '@/lib/data';
import { prisma } from '@/lib/db';
import { listingQuality } from '@/lib/listing-quality';
import AgentDashboardClient from '@/components/dashboard/AgentDashboardClient';
import { getSession } from '@/lib/session';

/**
 * Reading the clock inside the component body trips react-hooks/purity, which
 * cannot tell an async server component (rendered once per request) from a
 * client component that may re-render at any moment. The call is legitimate
 * here, so it lives in its own function rather than under a suppression.
 */
function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export default async function AgentDashboard() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

  const agent = await getAgentById(agentId);
  if (!agent) redirect('/auth');

  const dayAgo = hoursAgo(24);
  const monthAgo = hoursAgo(24 * 30);

  const [myInquiries, marketQualitySample, marketListings, marketLeads, channelMix] = await Promise.all([
    // Scoped to this agent, matching the sidebar badge, which counts
    // `{ agentId, isRead: false }`. The unassigned enquiries every agent can
    // see are a shared pool, not this agent's queue.
    prisma.inquiry.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, name: true, email: true, subject: true, message: true,
        propertyId: true, isRead: true, repliedAt: true, createdAt: true,
      },
    }),
    // The marketplace average the agent is compared against. Published only —
    // drafts nobody can see would drag the bar down for everyone.
    prisma.property.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        description: true, images: true, price: true, bedrooms: true, bathrooms: true,
        area: true, neighborhood: true, address: true, amenities: true, type: true,
      },
      take: 500,
    }),
    prisma.property.count({ where: { status: 'PUBLISHED' } }),
    prisma.inquiry.count(),
    // How buyers actually reached this agent. Every press of a WhatsApp, call
    // or email button on one of their listings writes a ContactEvent; the
    // enquiry form writes one too, as FORM.
    prisma.contactEvent.groupBy({
      by: ['channel'],
      where: { agentId, createdAt: { gte: monthAgo } },
      _count: { _all: true },
    }),
  ]);

  const myProperties = agent.properties || [];

  // Listings that need attention: lowest quality first, since that is the list
  // an agent can actually act on.
  const scored = myProperties
    .map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      images: p.images ?? [],
      quality: listingQuality({
        description: p.description,
        images: p.images,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        area: p.area,
        neighborhood: p.neighborhood,
        address: p.address,
        amenities: p.amenities,
        type: p.type,
      }),
    }))
    .sort((x, y) => x.quality.score - y.quality.score);

  const marketQuality = marketQualitySample.length
    ? Math.round(
        marketQualitySample.reduce((sum, p) => sum + listingQuality(p).score, 0) /
          marketQualitySample.length,
      )
    : null;

  const myQuality = scored.length
    ? Math.round(scored.reduce((sum, s) => sum + s.quality.score, 0) / scored.length)
    : null;

  const titleById = new Map(myProperties.map((p) => [p.id, p.title]));

  return (
    <AgentDashboardClient
      agentName={agent.name}
      stats={{
        liveListings: myProperties.filter((p) => p.status === 'PUBLISHED').length,
        pendingListings: myProperties.filter((p) => p.status !== 'PUBLISHED').length,
        views: myProperties.reduce((sum, p) => sum + (p.views ?? 0), 0),
        contactClicks: myProperties.reduce((sum, p) => sum + (p.contactClicks ?? 0), 0),
        leadsThisMonth: myInquiries.filter((i) => i.createdAt >= monthAgo).length,
      }}
      leads={myInquiries.map((i) => ({
        id: i.id,
        name: i.name,
        contact: i.email,
        subject: i.subject,
        message: i.message,
        listing: i.propertyId ? (titleById.get(i.propertyId) ?? 'Listing removed') : null,
        answered: Boolean(i.repliedAt) || i.isRead,
        // Hours the buyer has been waiting, or waited before someone replied.
        waitedHours: ((i.repliedAt ?? new Date()).getTime() - i.createdAt.getTime()) / 3600000,
        createdAt: i.createdAt.toISOString(),
      }))}
      overdueLeads={myInquiries.filter((i) => !i.isRead && !i.repliedAt && i.createdAt < dayAgo).length}
      attention={scored
        .filter((s) => s.quality.band !== 'good')
        .slice(0, 5)
        .map((s) => ({
          id: s.id,
          title: s.title,
          status: s.status,
          image: s.images[0] ?? null,
          score: s.quality.score,
          band: s.quality.band,
          missing: s.quality.missing,
        }))}
      channels={channelMix
        .map((c) => ({ channel: c.channel, count: c._count._all }))
        .sort((x, y) => y.count - x.count)}
      compare={{
        myQuality,
        marketQuality,
        myLeadsPerListing: myProperties.length ? myInquiries.length / myProperties.length : null,
        marketLeadsPerListing: marketListings ? marketLeads / marketListings : null,
      }}
    />
  );
}
