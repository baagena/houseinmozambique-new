import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import SubscribersClient from '@/components/dashboard/SubscribersClient';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminSubscribersPage() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

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
