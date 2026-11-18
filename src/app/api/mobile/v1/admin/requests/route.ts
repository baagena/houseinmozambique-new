import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';
import { agentsToNotify } from '@/lib/property-requests';

/**
 * Buyer requests waiting on a decision (web: dashboard/admin/requests), oldest
 * first. Release / reject / close goes to the shared
 * POST /api/admin/property-requests/:id.
 */
export async function GET(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [rows, reach] = await Promise.all([
    prisma.propertyRequest.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      take: 200,
      include: { _count: { select: { responses: true } } },
    }),
    agentsToNotify(),
  ]);

  return NextResponse.json({
    paidAgentCount: reach.length,
    requests: rows.map((r) => ({
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
    })),
  });
}
