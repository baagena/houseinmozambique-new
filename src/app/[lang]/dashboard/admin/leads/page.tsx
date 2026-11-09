import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import AdminLeadsClient, { type AdminLead } from '@/components/dashboard/AdminLeadsClient';

export const dynamic = 'force-dynamic';

/**
 * The leads ledger.
 *
 * Built on Inquiry, which is what the platform actually captures today: an
 * enquiry form submission. The reference also shows WhatsApp clicks and call
 * reveals as sources — those need the Lead model from the design package's
 * migration and the tracked links that write it (Phase 2). Until that lands the
 * source chips show a real count of zero rather than pretending.
 *
 * Every figure on this page is computed from the database. Nothing is sample.
 */
export default async function AdminLeadsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/auth');

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [inquiries, engagement] = await Promise.all([
    prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        propertyId: true,
        isRead: true,
        repliedAt: true,
        createdAt: true,
        agent: { select: { name: true } },
      },
    }),
    // View → contact rate across the whole catalogue.
    prisma.property.aggregate({ _sum: { views: true, contactClicks: true } }),
  ]);

  // Inquiry.propertyId is a plain column, not a relation, so titles need a
  // second lookup. One query for the whole page rather than one per row.
  const propertyIds = [...new Set(inquiries.map((i) => i.propertyId).filter((x): x is string => Boolean(x)))];
  const properties = propertyIds.length
    ? await prisma.property.findMany({
        where: { id: { in: propertyIds } },
        select: { id: true, title: true },
      })
    : [];
  const titleById = new Map(properties.map((p) => [p.id, p.title]));

  const leads: AdminLead[] = inquiries.map((i) => ({
    id: i.id,
    name: i.name,
    contact: i.email,
    subject: i.subject,
    listing: i.propertyId ? (titleById.get(i.propertyId) ?? 'Listing removed') : null,
    agent: i.agent?.name ?? null,
    source: 'FORM',
    createdAt: i.createdAt.toISOString(),
    repliedAt: i.repliedAt ? i.repliedAt.toISOString() : null,
    isRead: i.isRead,
  }));

  // Median, not mean: one lead answered a week late would drag an average and
  // misrepresent the typical wait.
  const responseMinutes = inquiries
    .filter((i) => i.repliedAt)
    .map((i) => (i.repliedAt!.getTime() - i.createdAt.getTime()) / 60000)
    .sort((a, b) => a - b);
  const medianMinutes = responseMinutes.length
    ? responseMinutes[Math.floor(responseMinutes.length / 2)]
    : null;

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const totalViews = engagement._sum.views ?? 0;
  const totalContacts = engagement._sum.contactClicks ?? 0;

  return (
    <AdminLeadsClient
      leads={leads}
      stats={{
        last30: inquiries.filter((i) => i.createdAt >= since).length,
        medianMinutes,
        unansweredPastDay: inquiries.filter((i) => !i.repliedAt && i.createdAt.getTime() < dayAgo).length,
        contactRate: totalViews > 0 ? (totalContacts / totalViews) * 100 : null,
      }}
    />
  );
}
