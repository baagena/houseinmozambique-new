import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import AdminAdsClient from '@/components/dashboard/AdminAdsClient';
import { getSession } from '@/lib/session';

export default async function AdminAdsPage() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

  const admin = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { role: true },
  });
  if (!admin || admin.role !== 'ADMIN') redirect('/dashboard/agent');

  const ads = await prisma.advertisement.findMany({
    orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
  });

  const serialized = ads.map((ad) => ({
    ...ad,
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
  }));

  return <AdminAdsClient ads={serialized} />;
}
