import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import AdminApprovalsClient from '@/components/dashboard/AdminApprovalsClient';
import { getSession } from '@/lib/session';
import { AGENT_PUBLIC } from '@/lib/dto';

export default async function AdminApprovalsPage() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

  const admin = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { role: true },
  });

  if (!admin || admin.role !== 'ADMIN') redirect('/dashboard/agent');

  // Fetch all PENDING properties with their host agent info
  const pendingProperties = await prisma.property.findMany({
    where: { status: 'PENDING' },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          initials: true,
          title: true,
          location: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Names and prices of the plans pending listings asked for.
  const requestedSlugs = Array.from(new Set(pendingProperties.map((p) => p.requestedPlanSlug).filter(Boolean))) as string[];
  const requestedPlans = requestedSlugs.length
    ? await prisma.pricingPlan.findMany({
        where: { slug: { in: requestedSlugs } },
        select: { slug: true, namePt: true, nameEn: true, pricePt: true, unitPt: true },
      })
    : [];
  const planLabel = new Map(
    requestedPlans.map((p) => [p.slug, `${p.namePt || p.nameEn} — ${`${p.pricePt} ${p.unitPt}`.trim()}`]),
  );

  const hostIds = Array.from(new Set(pendingProperties.map((property) => property.hostId)));
  const payments = hostIds.length > 0
    ? await prisma.payment.findMany({
        where: { userId: { in: hostIds } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    : [];

  const paymentsByUserId = payments.reduce<Record<string, typeof payments>>((acc, payment) => {
    acc[payment.userId] = acc[payment.userId] || [];
    acc[payment.userId].push(payment);
    return acc;
  }, {});

  const propertiesWithPayments = pendingProperties.map((property) => ({
    ...property,
    requestedPlan: property.requestedPlanSlug ? planLabel.get(property.requestedPlanSlug) ?? property.requestedPlanSlug : null,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
    payments: (paymentsByUserId[property.hostId] || []).map((payment) => ({
      ...payment,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      completedAt: payment.completedAt?.toISOString() || null,
    })),
  }));

  // Fetch recently registered agents (last 30 days) — "Agent Applications"
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newAgentsRaw = await prisma.agent.findMany({
    where: {
      role: 'AGENT',
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: AGENT_PUBLIC,
  });

  const newAgents = newAgentsRaw.map((agent) => ({
    ...agent,
    createdAt: agent.createdAt.toISOString(),
  }));

  return (
    <AdminApprovalsClient
      pendingProperties={propertiesWithPayments}
      newAgents={newAgents}
    />
  );
}
