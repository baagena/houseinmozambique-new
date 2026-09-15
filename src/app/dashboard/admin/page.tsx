import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getPlatformStats, getChartData } from '@/lib/data';
import AdminDashboardClient from '@/components/dashboard/AdminDashboardClient';
import { getSession } from '@/lib/session';
import { AGENT_ADMIN_LIST } from '@/lib/dto';

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

  const admin = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!admin || admin.role !== 'ADMIN') {
    redirect('/dashboard/agent');
  }

  const stats = await getPlatformStats();
  const chartData = await getChartData();
  
  const latestAgents = await prisma.agent.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: AGENT_ADMIN_LIST,
  });

  const recentInquiries = await prisma.inquiry.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' },
  });

  const [newsletterCount, pendingPayments, recentPayments] = await Promise.all([
    prisma.inquiry.count({ where: { subject: 'Newsletter subscription' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <AdminDashboardClient
      stats={{ ...stats, newsletterCount, pendingPayments }}
      chartData={chartData}
      latestAgents={latestAgents}
      recentInquiries={recentInquiries}
      recentPayments={recentPayments}
    />
  );
}
