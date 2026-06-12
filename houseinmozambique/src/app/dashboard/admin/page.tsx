import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getPlatformStats, getChartData } from '@/lib/data';
import AdminDashboardClient from '@/components/dashboard/AdminDashboardClient';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) {
    redirect('/auth');
  }

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
