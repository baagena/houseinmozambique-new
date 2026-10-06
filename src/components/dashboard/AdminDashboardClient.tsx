'use client';

import type { TrafficSummary } from '@/lib/site-traffic';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';
import StatTile from '@/components/dashboard/StatTile';
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
  /** Website visitors and pageviews (lib/site-traffic.ts). */
  traffic?: TrafficSummary;
  /** Sum of every listing's view count. */
  listingViews?: number;
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
  traffic,
  listingViews = 0,
  stats,
  chartData,
  latestAgents,
  recentInquiries = [],
  recentPayments = [],
}: AdminDashboardClientProps) {
  const { t, lang } = useLanguage();

  return (
    <div className="space-y-7">
      <div>
        <h2 className="display text-xl font-semibold text-[#002045] tracking-tight">
          {t.dashboard.admin.platformOverview}
        </h2>
        <p className="mt-1 text-sm text-[#74777f]">
          {t.dashboard.admin.platformDesc}
        </p>
      </div>

      <div className="stat-row" style={{ marginBottom: 0 }}>
        <StatTile
          label={t.dashboard.stats.totalProperties}
          value={stats.propertyCount}
          icon="domain"
          hint="Every listing, whatever its state"
        />
        <StatTile
          label={t.dashboard.stats.activeAgents}
          value={stats.agentCount}
          icon="group"
          hint="Verified and able to publish"
        />
        <StatTile
          label="Total inquiries"
          value={stats.totalInquiries || 0}
          icon="forum"
          hint="From listing and contact forms"
        />
        <StatTile
          label="Pending payments"
          value={stats.pendingPayments || 0}
          icon="payments"
          tone={(stats.pendingPayments || 0) > 0 ? 'warn' : 'default'}
          hint={(stats.pendingPayments || 0) > 0 ? 'Needs review' : 'Nothing outstanding'}
        />
      </div>

      {traffic && <TrafficPanel traffic={traffic} listingViews={listingViews} pt={lang === 'pt'} />}

      <section className="bg-white rounded-xl border border-[#eceef1] p-5">
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold text-[#002045] m-0">Analytics</h3>
          <p className="mt-0.5 text-xs text-[#9aa0a8]">
            Listings, agents, inquiries and revenue over the selected period
          </p>
        </div>
        <AnalyticsChart data={chartData} />
      </section>

      {/* items-start: grid stretches children to equal row height by default, which
          left a short card padded out with dead space beside a taller one. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#eceef1] overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#eceef1]">
            <div>
              <h3 className="text-[15px] font-semibold text-[#002045] m-0">{t.dashboard.admin.activeCurators}</h3>
              <p className="mt-0.5 text-xs text-[#9aa0a8]">Most recently approved, newest first</p>
            </div>
            <Link href="/dashboard/admin/approvals" className="text-xs font-medium text-[#845326] hover:underline whitespace-nowrap">
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

/**
 * Who comes to the website: visitors (one per browser per day) and pageviews,
 * today and over the last 7 and 30 days, with a 30-day bar strip. Listing views
 * are the separate per-property count shown on each listing.
 */
function TrafficPanel({ traffic, listingViews, pt }: { traffic: TrafficSummary; listingViews: number; pt: boolean }) {
  const n = (v: number) => v.toLocaleString(pt ? 'pt-PT' : 'en-GB');
  const max = Math.max(1, ...traffic.daily.map((d) => d.visitors));
  const since = traffic.since
    ? new Date(`${traffic.since}T12:00:00Z`).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <section className="bg-white rounded-xl border border-[#eceef1] p-5">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold text-[#002045] m-0">{pt ? 'Visitantes do site' : 'Website visitors'}</h3>
        <p className="mt-0.5 text-xs text-[#9aa0a8]">
          {pt
            ? 'Um visitante é um navegador por dia; robôs e a equipa não contam.'
            : 'A visitor is one browser per day; bots and staff are not counted.'}
          {since && (pt ? ` A contar desde ${since}.` : ` Counting since ${since}.`)}
        </p>
      </div>

      <div className="stat-row" style={{ marginBottom: 16 }}>
        <StatTile label={pt ? 'Visitantes hoje' : 'Visitors today'} value={n(traffic.today.visitors)} icon="person"
          hint={pt ? `${n(traffic.today.pageviews)} páginas vistas` : `${n(traffic.today.pageviews)} pageviews`} />
        <StatTile label={pt ? 'Últimos 7 dias' : 'Last 7 days'} value={n(traffic.last7.visitors)} icon="group"
          hint={pt ? `${n(traffic.last7.pageviews)} páginas vistas` : `${n(traffic.last7.pageviews)} pageviews`} />
        <StatTile label={pt ? 'Últimos 30 dias' : 'Last 30 days'} value={n(traffic.last30.visitors)} icon="trending_up"
          hint={pt ? `${n(traffic.last30.pageviews)} páginas vistas` : `${n(traffic.last30.pageviews)} pageviews`} />
        <StatTile label={pt ? 'Visualizações de imóveis' : 'Listing views'} value={n(listingViews)} icon="visibility"
          hint={pt ? 'Todos os anúncios, desde sempre' : 'All listings, all time'} />
      </div>

      <div
        role="img"
        aria-label={pt ? 'Visitantes por dia, últimos 30 dias' : 'Visitors per day, last 30 days'}
        style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 64 }}
      >
        {traffic.daily.map((d) => (
          <div
            key={d.day}
            title={`${d.day}: ${n(d.visitors)} ${pt ? 'visitantes' : 'visitors'}, ${n(d.pageviews)} ${pt ? 'páginas' : 'pageviews'}`}
            style={{
              flex: 1,
              height: `${Math.max(3, (d.visitors / max) * 100)}%`,
              background: d.visitors ? 'var(--d-ink, #002045)' : 'var(--d-border, #e3e5e8)',
              borderRadius: 3,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9aa0a8', marginTop: 4 }}>
        <span>{traffic.daily[0]?.day}</span>
        <span>{pt ? 'hoje' : 'today'}</span>
      </div>
    </section>
  );
}
