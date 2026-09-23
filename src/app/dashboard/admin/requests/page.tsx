import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { agentsToNotify } from '@/lib/property-requests';
import AdminRequestsClient, { type AdminRequest } from '@/components/dashboard/AdminRequestsClient';

export const dynamic = 'force-dynamic';

/**
 * The buyer requirements waiting on a decision.
 *
 * Oldest first: somebody who posted three days ago and heard nothing is the
 * person most likely to give up on the platform, and a newest-first queue
 * quietly starves exactly them.
 */
export default async function AdminRequestsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/auth');

  const [rows, reach] = await Promise.all([
    prisma.propertyRequest.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      take: 200,
      include: { _count: { select: { responses: true } } },
    }),
    // What a release would actually reach, shown on the button itself.
    agentsToNotify(),
  ]);

  const requests: AdminRequest[] = rows.map((r) => ({
    id: r.id,
    ref: r.ref,
    status: r.status,
    name: r.name,
    email: r.email,
    phone: r.phone,
    anonymous: r.anonymous,
    intent: r.intent,
    propertyType: r.propertyType,
    city: r.city,
    areas: r.areas,
    budgetMinMinor: r.budgetMinMinor,
    budgetMaxMinor: r.budgetMaxMinor,
    currency: r.currency,
    minBeds: r.minBeds,
    moveBy: r.moveBy?.toISOString() ?? null,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    broadcastAt: r.broadcastAt?.toISOString() ?? null,
    broadcastTo: r.broadcastTo,
    responseCount: r._count.responses,
    reviewedBy: r.reviewedBy,
    reviewNote: r.reviewNote,
  }));

  return <AdminRequestsClient requests={requests} paidAgentCount={reach.length} />;
}
