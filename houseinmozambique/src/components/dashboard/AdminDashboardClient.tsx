'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';
import StatCard from '@/components/dashboard/StatCard';
import AnalyticsChart from '@/components/dashboard/AnalyticsChart';

interface DashboardAgent {
  id: string;
  name: string;
  email?: string;
  initials: string;
  title: string;
  location: string;
  avatar?: string | null;
  specializations?: string[];
  createdAt: string | Date;
}

interface DashboardInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  createdAt: string | Date;
}

interface DashboardPayment {
  id: string;
  orderRef: string;
  amount: number;
  currency: string;
  transactionId: string | null;
  customerName: string;
  status: string;
}

interface AdminDashboardClientProps {
  stats: {
    propertyCount: number;
    agentCount: number;
    totalInquiries?: number;
    newsletterCount?: number;
    pendingPayments?: number;
  };
  chartData: Array<{
    date: string;
    properties: number;
    agents: number;
    inquiries: number;
    revenue: number;
  }>;
  latestAgents: DashboardAgent[];
  recentInquiries?: DashboardInquiry[];
  recentPayments?: DashboardPayment[];
}

export default function AdminDashboardClient({
  stats,
  chartData,
  latestAgents,
  recentInquiries = [],
  recentPayments = [],
}: AdminDashboardClientProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-black text-[#002045] tracking-tighter mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
          {t.dashboard.admin.platformOverview}
        </h2>
        <p className="text-[#74777f] font-medium leading-relaxed">
          {t.dashboard.admin.platformDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.dashboard.stats.totalProperties} value={stats.propertyCount} trend={{ value: 14, isUp: true }} icon="domain" />
        <StatCard title={t.dashboard.stats.activeAgents} value={stats.agentCount} trend={{ value: 3, isUp: true }} icon="group" />
        <StatCard title="Pending Payments" value={stats.pendingPayments || 0} icon="payments" />
        <StatCard title="Newsletter Subscribers" value={stats.newsletterCount || 0} icon="mark_email_read" />
      </div>

      <div>
        <h3 className="text-2xl font-black text-[#002045] tracking-tight mb-8">Analytics</h3>
        <AnalyticsChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-black text-[#002045] tracking-tight">{t.dashboard.admin.activeCurators}</h3>
            <Link href="/dashboard/admin/approvals" className="text-[10px] font-black text-[#845326] uppercase tracking-[0.2em] hover:underline">
              {t.dashboard.admin.viewAllRequests}
            </Link>
          </div>

          <div className="bg-white rounded-[2rem] border border-[#f2f4f6] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse border-transparent">
              <thead>
                <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/50">
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">{t.dashboard.admin.curator}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">{t.dashboard.admin.specialization}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">{t.dashboard.admin.location}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6]">
                {latestAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-[#f7f9fb] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-10 h-10">
                          {agent.avatar ? (
                            <Image src={agent.avatar} alt={agent.name} fill className="rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#1a365d] font-black text-[10px]">
                              {agent.initials}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-[#002045] text-sm tracking-tight">{agent.name}</p>
                          <p className="text-[10px] text-[#c4c6cf] font-bold uppercase tracking-wider">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-[#845326] uppercase tracking-widest">
                        {agent.specializations?.[0] || agent.title || 'Agent'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#74777f]">{agent.location}</td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-[#74777f]">{new Date(agent.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-black text-[#002045] tracking-tight">{t.dashboard.admin.systemActivity}</h3>
            <Link href="/dashboard/admin/activities" className="text-[10px] font-black text-[#845326] uppercase tracking-[0.2em] hover:underline">View all</Link>
          </div>
          <div className="relative">
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-[#f2f4f6]" />
            <div className="space-y-8">
              {recentInquiries.length > 0 ? recentInquiries.map((inq) => (
                <div key={inq.id} className="flex gap-6 relative">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#f2f4f6] flex items-center justify-center shrink-0 z-10">
                    <div className={`w-2 h-2 rounded-full ${inq.subject === 'Newsletter subscription' ? 'bg-emerald-500' : 'bg-[#845326]'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#002045] leading-none mb-1">{inq.subject}</p>
                    <p className="text-[10px] text-[#74777f] font-medium uppercase tracking-widest">{inq.name} / {new Date(inq.createdAt).toLocaleString()}</p>
                    <p className="text-[10px] text-[#74777f] font-mono mt-1">{inq.email}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-[#74777f] font-medium italic">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-[#f2f4f6] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-[#f2f4f6] flex items-center justify-between">
          <h3 className="text-xl font-black text-[#002045] tracking-tight">Recent Payment References</h3>
          <Link href="/dashboard/admin/approvals" className="text-[10px] font-black text-[#845326] uppercase tracking-widest hover:underline">Verify in approvals</Link>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/50">
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Order Ref</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Name Used To Pay</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Payment Ref</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Amount</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f4f6]">
            {recentPayments.length > 0 ? recentPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-[#f7f9fb] transition-colors">
                <td className="px-6 py-4 text-xs font-mono text-[#002045]">{payment.orderRef}</td>
                <td className="px-6 py-4 text-xs font-bold text-[#002045]">{payment.customerName}</td>
                <td className="px-6 py-4 text-xs font-mono text-[#74777f]">{payment.transactionId || 'Not captured'}</td>
                <td className="px-6 py-4 text-xs font-bold text-[#74777f]">{payment.amount?.toLocaleString?.() || payment.amount} {payment.currency}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                    payment.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : payment.status === 'FAILED' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {payment.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm font-bold text-[#74777f]">No payment records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
