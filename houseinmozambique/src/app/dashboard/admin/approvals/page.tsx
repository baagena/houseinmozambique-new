import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import AdminApprovalsClient from '@/components/dashboard/AdminApprovalsClient';

export default async function AdminApprovalsPage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) redirect('/auth');

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
  });

  const newAgents = newAgentsRaw.map((agent) => ({
    ...agent,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
  }));

  return (
    <AdminApprovalsClient
      pendingProperties={propertiesWithPayments}
      newAgents={newAgents}
    />
  );
}
