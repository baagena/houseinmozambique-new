'use client';

import Image from 'next/image';
import { useLanguage } from '@/components/i18n/LanguageContext';
import StatCard from '@/components/dashboard/StatCard';
import AnalyticsChart from '@/components/dashboard/AnalyticsChart';

interface AdminDashboardClientProps {
  stats: {
    propertyCount: number;
    agentCount: number;
    totalInquiries?: number;
    totalRevenue?: number;
  };
  chartData: Array<{
    date: string;
    properties: number;
    agents: number;
    inquiries: number;
    revenue: number;
  }>;
  latestAgents: any[];
  recentInquiries?: any[];
}

export default function AdminDashboardClient({ stats, chartData, latestAgents, recentInquiries = [] }: AdminDashboardClientProps) {
  const { t } = useLanguage();
  const inquiries = recentInquiries || [];

  return (
    <div className="space-y-12">
      {/* Platform Header */}
      <div>
        <h2 className="text-3xl font-black text-[#002045] tracking-tighter mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
          {t.dashboard.admin.platformOverview}
        </h2>
        <p className="text-[#74777f] font-medium font-serif leading-relaxed italic">
          {t.dashboard.admin.platformDesc}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t.dashboard.stats.totalProperties} 
          value={stats.propertyCount} 
          trend={{ value: 14, isUp: true }} 
          icon="domain" 
        />
        <StatCard 
          title={t.dashboard.stats.activeAgents} 
          value={stats.agentCount} 
          trend={{ value: 3, isUp: true }} 
          icon="group" 
        />
        <StatCard 
          title={t.dashboard.stats.monthlyRevenue} 
          value={`$${(stats.totalRevenue || 0).toLocaleString()}`}
          trend={{ value: 12, isUp: true }} 
          icon="monetization_on" 
        />
        <StatCard 
          title={t.dashboard.stats.systemHealth} 
          value="99.9%" 
          icon="cloud_done" 
        />
      </div>

      {/* Analytics Charts */}
      <div>
        <h3 className="text-2xl font-black text-[#002045] tracking-tight mb-8">Analytics</h3>
        <AnalyticsChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Pending Agent Approvals */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-black text-[#002045] tracking-tight">{t.dashboard.admin.activeCurators}</h3>
            <button className="text-[10px] font-black text-[#845326] uppercase tracking-[0.2em] hover:underline">
              {t.dashboard.admin.viewAllRequests}
            </button>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-[#f2f4f6] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse border-transparent">
              <thead>
                <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/50">
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">{t.dashboard.admin.curator}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">{t.dashboard.admin.specialization}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">{t.dashboard.admin.location}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-right">{t.dashboard.admin.action}</th>
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
                          <p className="text-[10px] text-[#c4c6cf] font-bold uppercase tracking-wider">{agent.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-[#fab983] uppercase tracking-widest">Premium Curator</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#74777f]">
                      {agent.location}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                           <span className="material-symbols-outlined text-lg">close</span>
                         </button>
                         <button className="h-8 w-8 rounded-lg flex items-center justify-center border border-[#002045] text-[#002045] hover:bg-[#002045] hover:text-white transition-all shadow-sm">
                           <span className="material-symbols-outlined text-lg font-bold">check</span>
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Activity Feed */}
        <div className="space-y-8">
           <h3 className="text-xl font-black text-[#002045] tracking-tight">{t.dashboard.admin.systemActivity}</h3>
           <div className="relative">
              <div className="absolute left-[19px] top-6 bottom-6 w-px bg-[#f2f4f6]" />
               <div className="space-y-8">
                    {inquiries.length > 0 ? (
                      inquiries.map((inq: any) => (
                        <div key={inq.id} className="flex gap-6 relative">
                          <div className="w-10 h-10 rounded-full bg-[#f2f4f6]/10 flex items-center justify-center shrink-0 z-10 bg-white border border-[#f2f4f6]">
                             <div className="w-2 h-2 rounded-full bg-[#845326]" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#002045] leading-none mb-1">{inq.subject}</p>
                            <p className="text-[10px] text-[#74777f] font-medium uppercase tracking-widest">{inq.name} · {new Date(inq.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#74777f] font-medium italic">No recent activity.</p>
                    )}
                  </div>
           </div>
         </div>
      </div>
    </div>
  );
}
