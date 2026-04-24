import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import AdminPropertyActions from '@/components/dashboard/AdminPropertyActions';
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
    include: { host: { select: { name: true, initials: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch recently registered agents (last 30 days) — "Agent Applications"
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newAgents = await prisma.agent.findMany({
    where: {
      role: 'AGENT',
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <AdminApprovalsClient
      pendingProperties={pendingProperties}
      newAgents={newAgents}
    />
  );
}
