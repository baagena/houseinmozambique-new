import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAgentById } from '@/lib/data';
import StatCard from '@/components/dashboard/StatCard';

export default async function AgentDashboard() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) {
    redirect('/auth');
  }

  const agent = await getAgentById(agentId);
  
  if (!agent) {
    // If cookie exists but agent not found, clear cookie and redirect
    redirect('/auth');
  }

  const myProperties = agent.properties || [];
  
  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-black text-[#002045] tracking-tighter mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
          Portfolio Performance
        </h2>
        <p className="text-[#74777f] font-medium font-serif leading-relaxed italic">
          Hello, {agent.name}. Overview of your current real estate footprint.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Listings" 
          value={myProperties.length} 
          trend={{ value: 8, isUp: true }} 
          icon="home_work" 
        />
        <StatCard 
          title="Total Leads" 
          value="42" 
          trend={{ value: 12, isUp: true }} 
          icon="chat_bubble" 
        />
        <StatCard 
          title="Profile Views" 
          value="1,280" 
          trend={{ value: 5, isUp: false }} 
          icon="visibility" 
        />
        <StatCard 
          title="Portfolio Value" 
          value="$1.1M" 
          icon="payments" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Listings */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-black text-[#002045] tracking-tight">Active Listings</h3>
            <Link href="/dashboard/agent/listings" className="text-xs font-black text-[#845326] uppercase tracking-widest hover:underline">View All</Link>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-[#f2f4f6] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/50">
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Property</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6]">
                {myProperties.slice(0, 4).map((p) => (
                  <tr key={p.id} className="hover:bg-[#f7f9fb] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-[#f2f4f6]">
                          <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
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
                        <span className="text-xs font-bold text-[#002045]">Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-[#74777f] hover:text-[#002045] hover:bg-white rounded-lg border border-transparent hover:border-[#f2f4f6] transition-all">
                        <span className="material-symbols-outlined text-xl">edit_note</span>
                      </button>
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
            <h3 className="text-xl font-black text-[#002045] tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/post-property" className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-[#002045] text-white hover:-translate-y-1 transition-all shadow-xl shadow-[#002045]/10">
                <span className="material-symbols-outlined text-3xl">add_box</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Post Home</span>
              </Link>
              <button className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-white border border-[#f2f4f6] text-[#002045] hover:-translate-y-1 transition-all shadow-sm">
                <span className="material-symbols-outlined text-3xl text-[#fab983]">share</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Share Profile</span>
              </button>
            </div>
          </div>

          {/* Newest Leads */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#002045] tracking-tight">Recent Leads</h3>
            <div className="space-y-4">
              {[
                { name: 'Adolfo Macamo', time: '20m ago', property: 'Polana Villa' },
                { name: 'Celia Guambe', time: '1h ago', property: 'Costa do Sol Apt' },
                { name: 'Xavier Tembe', time: '4h ago', property: 'Sommerschield Loft' },
              ].map((lead, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-[#f2f4f6] flex items-center gap-4 hover:shadow-lg hover:shadow-[#002045]/5 transition-all group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-[#f7f9fb] flex items-center justify-center text-[#002045] font-black text-[10px] group-hover:bg-[#002045] group-hover:text-white transition-colors">
                    {lead.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-black text-[#002045] leading-none mb-1">{lead.name}</p>
                    <p className="text-[10px] text-[#74777f] font-medium truncate">Inquiry on <span className="font-bold text-[#845326]">{lead.property}</span></p>
                  </div>
                  <span className="text-[9px] font-bold text-[#c4c6cf] uppercase whitespace-nowrap">{lead.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
