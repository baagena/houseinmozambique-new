'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';
import StatCard from '@/components/dashboard/StatCard';

interface DashboardProperty {
  id: string;
  title: string;
  location: string;
  type: string;
  status: string;
  price: number;
  images?: string[] | null;
}

interface DashboardInquiry {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string | Date;
}

interface AgentDashboardClientProps {
  agentName: string;
  myProperties: DashboardProperty[];
  myInquiries: DashboardInquiry[];
}

export default function AgentDashboardClient({ agentName, myProperties, myInquiries }: AgentDashboardClientProps) {
  const { t } = useLanguage();
  const publishedListings = myProperties.filter((property) => property.status === 'PUBLISHED').length;
  const pendingListings = myProperties.filter((property) => property.status !== 'PUBLISHED').length;
  const portfolioValue = myProperties.reduce((sum, property) => sum + (Number(property.price) || 0), 0);
  const formattedPortfolioValue = portfolioValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-black text-[#002045] tracking-tighter mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
          {t.dashboard.agent.portfolioPerformance}
        </h2>
        <p className="text-[#74777f] font-medium font-serif leading-relaxed italic">
          {t.dashboard.agent.welcome.replace('{name}', agentName)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t.dashboard.stats.activeListings} 
          value={publishedListings} 
          icon="home_work" 
        />
        <StatCard 
          title={t.dashboard.stats.totalLeads} 
          value={myInquiries.length} 
          icon="chat_bubble" 
        />
        <StatCard 
          title="Pending Listings" 
          value={pendingListings} 
          icon="pending_actions" 
        />
        <StatCard 
          title={t.dashboard.stats.portfolioValue} 
          value={formattedPortfolioValue} 
          icon="payments" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Listings */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-black text-[#002045] tracking-tight">{t.dashboard.agent.activeListingsTitle}</h3>
            <Link href="/dashboard/agent/listings" className="text-xs font-black text-[#845326] uppercase tracking-widest hover:underline">
              {t.dashboard.agent.viewAll}
            </Link>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-[#f2f4f6] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/50">
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">{t.dashboard.agent.property}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">{t.dashboard.agent.type}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">{t.dashboard.agent.status}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-right">{t.dashboard.agent.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6]">
                {myProperties.slice(0, 4).map((p) => (
                  <tr key={p.id} className="hover:bg-[#f7f9fb] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-[#f2f4f6]">
                          {p.images && p.images[0] ? (
                            <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#f2f4f6] flex items-center justify-center">
                              <span className="material-symbols-outlined text-[#74777f]">image</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-[#002045] text-sm tracking-tight">{p.title}</p>
                          <p className="text-[10px] text-[#74777f] font-medium">{p.location.split(',')[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-[#002045] uppercase tracking-widest px-2 py-1 bg-[#f2f4f6] rounded-md">{p.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-[#002045]">
                          {p.status === 'PUBLISHED' ? t.dashboard.agent.statusActive : t.dashboard.agent.statusPending}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/post-property?edit=${p.id}`} className="p-2 text-[#74777f] hover:text-[#002045] hover:bg-white rounded-lg border border-transparent hover:border-[#f2f4f6] transition-all inline-flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">edit_note</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Recent Leads Sidebar */}
        <div className="space-y-12">
          {/* Quick Actions */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#002045] tracking-tight">{t.dashboard.agent.quickActions}</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/post-property" className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-[#002045] text-white hover:-translate-y-1 transition-all shadow-xl shadow-[#002045]/10">
                <span className="material-symbols-outlined text-3xl">add_box</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{t.dashboard.agent.postHome}</span>
              </Link>
              <a href={`mailto:hello@houseinmoz.com?subject=Share%20my%20agent%20profile&body=Hello%2C%0A%0APlease%20review%20my%20agent%20profile%20on%20House%20in%20Mozambique.%0A%0AThank%20you.%0A`} className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-white border border-[#f2f4f6] text-[#002045] hover:-translate-y-1 transition-all shadow-sm">
                <span className="material-symbols-outlined text-3xl text-[#fab983]">share</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{t.dashboard.agent.shareProfile}</span>
              </a>
            </div>
          </div>

          {/* Newest Leads */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#002045] tracking-tight">{t.dashboard.agent.recentLeads}</h3>
            <div className="space-y-4">
              {myInquiries.slice(0, 3).map((lead, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-[#f2f4f6] flex flex-col gap-4 hover:shadow-lg hover:shadow-[#002045]/5 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#f7f9fb] flex items-center justify-center text-[#002045] font-black text-[10px] group-hover:bg-[#002045] group-hover:text-white transition-colors">
                      {lead.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-black text-[#002045] leading-none mb-1">{lead.name}</p>
                      <p className="text-[10px] text-[#74777f] font-medium truncate">
                        {t.dashboard.agent.inquiryOn} <span className="font-bold text-[#845326]">{lead.subject}</span>
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-[#c4c6cf] uppercase whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <a
                    href={`mailto:${lead.email}?subject=${encodeURIComponent(`Reply: ${lead.subject}`)}&body=${encodeURIComponent(`Hello ${lead.name},\n\nThank you for reaching out. Regarding your inquiry: "${lead.message}"\n\nHow can I best assist you?\n\nBest regards,\n`)}`}
                    className="inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-[#002045] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#001a38] transition-colors"
                  >
                    {t.dashboard.agent.replyToLead}
                  </a>
                </div>
              ))}
              {myInquiries.length === 0 && (
                <p className="text-sm text-[#74777f] font-medium italic">No leads captured yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
