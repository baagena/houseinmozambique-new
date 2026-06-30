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
    <div className="space-y-7">
      <div>
        <h2 className="text-xl font-semibold text-[#002045] tracking-tight">
          {t.dashboard.admin.platformOverview}
        </h2>
        <p className="mt-1 text-sm text-[#74777f]">
          {t.dashboard.admin.platformDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t.dashboard.stats.totalProperties} value={stats.propertyCount} icon="domain" />
        <StatCard title={t.dashboard.stats.activeAgents} value={stats.agentCount} icon="group" />
        <StatCard title="Total inquiries" value={stats.totalInquiries || 0} icon="forum" />
        <StatCard title="Pending payments" value={stats.pendingPayments || 0} icon="payments" />
      </div>

      <section className="bg-white rounded-xl border border-[#eceef1] p-5">
        <h3 className="text-sm font-semibold text-[#002045] mb-4">Analytics</h3>
        <AnalyticsChart data={chartData} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#eceef1] overflow-hidden">
          <div className="flex items-center justify-between px-5 h-12 border-b border-[#eceef1]">
            <h3 className="text-sm font-semibold text-[#002045]">{t.dashboard.admin.activeCurators}</h3>
            <Link href="/dashboard/admin/approvals" className="text-xs font-medium text-[#845326] hover:underline">
              {t.dashboard.admin.viewAllRequests}
            </Link>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#eceef1] bg-[#fafbfc]">
                <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">{t.dashboard.admin.curator}</th>
                <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">{t.dashboard.admin.specialization}</th>
                <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">{t.dashboard.admin.location}</th>
                <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8] text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f6]">
              {latestAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-[#fafbfc] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 shrink-0">
                        {agent.avatar ? (
                          <Image src={agent.avatar} alt={agent.name} fill className="rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#f5f6f8] flex items-center justify-center text-[#1a365d] font-semibold text-[11px]">
                            {agent.initials}
                          </div>
                        )}
                      </div>
                      <div className="leading-tight">
                        <p className="font-medium text-[#002045] text-[13px]">{agent.name}</p>
                        <p className="text-[12px] text-[#9aa0a8]">{agent.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#5b616b]">
                    {agent.specializations?.[0] || agent.title || 'Agent'}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#74777f]">{agent.location}</td>
                  <td className="px-5 py-3 text-right text-[13px] text-[#74777f] tabular-nums">{new Date(agent.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-[#eceef1] overflow-hidden">
          <div className="flex items-center justify-between px-5 h-12 border-b border-[#eceef1]">
            <h3 className="text-sm font-semibold text-[#002045]">{t.dashboard.admin.systemActivity}</h3>
            <Link href="/dashboard/admin/activities" className="text-xs font-medium text-[#845326] hover:underline">View all</Link>
          </div>
          <div className="p-5">
            <div className="relative">
              <div className="absolute left-[15px] top-3 bottom-3 w-px bg-[#eceef1]" />
              <div className="space-y-5">
                {recentInquiries.length > 0 ? recentInquiries.map((inq) => (
                  <div key={inq.id} className="flex gap-3.5 relative">
                    <div className="w-[30px] h-[30px] rounded-full bg-white border border-[#eceef1] flex items-center justify-center shrink-0 z-10">
                      <div className={`w-1.5 h-1.5 rounded-full ${inq.subject === 'Newsletter subscription' ? 'bg-emerald-500' : 'bg-[#845326]'}`} />
                    </div>
                    <div className="leading-snug pt-0.5">
                      <p className="text-[13px] font-medium text-[#002045]">{inq.subject}</p>
                      <p className="text-[12px] text-[#9aa0a8]">{inq.name} · {new Date(inq.createdAt).toLocaleDateString()}</p>
                      <p className="text-[12px] text-[#b4b9c0]">{inq.email}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-[#9aa0a8]">No recent activity.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#eceef1] overflow-hidden">
        <div className="px-5 h-12 border-b border-[#eceef1] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#002045]">Recent payment references</h3>
          <Link href="/dashboard/admin/approvals" className="text-xs font-medium text-[#845326] hover:underline">Verify in approvals</Link>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#eceef1] bg-[#fafbfc]">
              <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">Order ref</th>
              <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">Name used to pay</th>
              <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">Payment ref</th>
              <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">Amount</th>
              <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f4f6]">
            {recentPayments.length > 0 ? recentPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-[#fafbfc] transition-colors">
                <td className="px-5 py-3 text-[13px] font-mono text-[#002045]">{payment.orderRef}</td>
                <td className="px-5 py-3 text-[13px] font-medium text-[#002045]">{payment.customerName}</td>
                <td className="px-5 py-3 text-[13px] font-mono text-[#74777f]">{payment.transactionId || 'Not captured'}</td>
                <td className="px-5 py-3 text-[13px] text-[#5b616b] tabular-nums">{payment.amount?.toLocaleString?.() || payment.amount} {payment.currency}</td>
                <td className="px-5 py-3">
                  <StatusPill status={payment.status} />
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#9aa0a8]">No payment records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === 'COMPLETED'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'FAILED'
      ? 'bg-red-50 text-red-600'
      : 'bg-amber-50 text-amber-700';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${styles}`}>
      {status.toLowerCase()}
    </span>
  );
}
