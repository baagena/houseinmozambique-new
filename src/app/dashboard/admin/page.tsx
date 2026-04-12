'use client';

import StatCard from '@/components/dashboard/StatCard';
import { properties, agents } from '@/lib/dummyData';
import Image from 'next/image';

export default function AdminDashboard() {
  return (
    <div className="space-y-12">
      {/* Platform Header */}
      <div>
        <h2 className="text-3xl font-black text-[#002045] tracking-tighter mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
          Platform Overview
        </h2>
        <p className="text-[#74777f] font-medium font-serif leading-relaxed italic">
          Master monitoring and oversight of the HouseinMozambique ecosystem.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Properties" 
          value={properties.length} 
          trend={{ value: 14, isUp: true }} 
          icon="domain" 
        />
        <StatCard 
          title="Active Agents" 
          value={agents.length} 
          trend={{ value: 3, isUp: true }} 
          icon="group" 
        />
        <StatCard 
          title="Monthly Revenue" 
          value="$24,500" 
          trend={{ value: 12, isUp: true }} 
          icon="monetization_on" 
        />
        <StatCard 
          title="System Health" 
          value="99.9%" 
          icon="cloud_done" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Pending Agent Approvals */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-black text-[#002045] tracking-tight">Pending Agent Approvals</h3>
            <button className="text-[10px] font-black text-[#845326] uppercase tracking-[0.2em] hover:underline">View All Requests</button>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-[#f2f4f6] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse border-transparent">
              <thead>
                <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/50">
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Applicant</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Specialization</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Experience</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6]">
                {[
                  { name: 'Bernardo Matola', spec: 'Industrial Real Estate', exp: '12 Years', date: '2h ago' },
                  { name: 'Isabel Langa', spec: 'Coastal Retreats', exp: '4 Years', date: '5h ago' },
                  { name: 'Tomas Tembe', spec: 'Urban Luxury', exp: '7 Years', date: '1d ago' },
                ].map((app, i) => (
                  <tr key={i} className="hover:bg-[#f7f9fb] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#1a365d] font-black text-[10px]">
                          {app.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-black text-[#002045] text-sm tracking-tight">{app.name}</p>
                          <p className="text-[10px] text-[#c4c6cf] font-bold uppercase tracking-wider">{app.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-[#fab983] uppercase tracking-widest">{app.spec}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#74777f]">
                      {app.exp}
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
           <h3 className="text-xl font-black text-[#002045] tracking-tight">System Activity</h3>
           <div className="relative">
              <div className="absolute left-[19px] top-6 bottom-6 w-px bg-[#f2f4f6]" />
              <div className="space-y-8">
                {[
                  { action: 'New Listing Approved', user: 'Ricardo Santos', time: '12m ago', color: 'bg-emerald-500' },
                  { action: 'Security Protocol Updated', user: 'System', time: '1h ago', color: 'bg-blue-500' },
                  { action: 'Agent Subscription Renewed', user: 'Elena Matusse', time: '3h ago', color: 'bg-[#fab983]' },
                  { action: 'New Support Ticket', user: 'Guest User', time: '6h ago', color: 'bg-red-500' },
                ].map((act, i) => (
                  <div key={i} className="flex gap-6 relative">
                    <div className={`w-10 h-10 rounded-full ${act.color}/10 flex items-center justify-center shrink-0 z-10 bg-white border border-[#f2f4f6]`}>
                       <div className={`w-2 h-2 rounded-full ${act.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#002045] leading-none mb-1">{act.action}</p>
                      <p className="text-[10px] text-[#74777f] font-medium uppercase tracking-widest">{act.user} · {act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           {/* Platform Status Card */}
           <div className="bg-gradient-to-br from-[#1a365d] to-[#002045] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-700" />
              <h3 className="text-xl font-black mb-6 relative z-10" style={{ fontFamily: 'var(--font-headline)' }}>Infrastructure</h3>
              <div className="space-y-4 relative z-10">
                 <div className="flex justify-between items-center bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Database</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#fab983]">Active</span>
                 </div>
                 <div className="flex justify-between items-center bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">CDN Nodes</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#fab983]">Stable</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
