import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import SubscribersClient from '@/components/dashboard/SubscribersClient';

export const dynamic = 'force-dynamic';

export default async function AdminSubscribersPage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;
  if (!agentId) redirect('/auth');

  const admin = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { role: true },
  });
  if (!admin || admin.role !== 'ADMIN') redirect('/dashboard/agent');

  const subscribers = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <SubscribersClient
      subscribers={subscribers.map((subscriber) => ({
        id: subscriber.id,
        email: subscriber.email,
        isActive: subscriber.isActive,
        source: subscriber.source,
        createdAt: subscriber.createdAt.toISOString(),
        lastEmailedAt: subscriber.lastEmailedAt?.toISOString() ?? null,
      }))}
    />
  );
}
