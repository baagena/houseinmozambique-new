import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import AdminAdsClient from '@/components/dashboard/AdminAdsClient';

export default async function AdminAdsPage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;
  if (!agentId) redirect('/auth');

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
