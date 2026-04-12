'use client';

import { useState } from 'react';
import { agents, properties } from '@/lib/dummyData';
import Image from 'next/image';

export default function AdminAgentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-[#f2f4f6] shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-[#002045] tracking-tighter mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
            Manage Agents
          </h1>
          <p className="text-xs font-bold text-[#74777f] uppercase tracking-widest">
            Currently overseeing <span className="text-[#002045]">{agents.length}</span> professional curators
          </p>
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#c4c6cf] text-xl">search</span>
            <input 
              type="text" 
              placeholder="Search by name, role, or location..."
              className="pl-12 pr-6 py-4 bg-[#f7f9fb] border-none rounded-2xl text-sm font-bold text-[#002045] placeholder-[#c4c6cf] w-full sm:w-96 focus:ring-4 focus:ring-[#002045]/5 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-[#002045] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#002045]/10 hover:-translate-y-1 transition-all active:scale-95 hidden sm:flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">person_add</span>
            Add Agent
          </button>
        </div>
      </div>

      {/* Agents Grid/Table */}
      <div className="bg-white rounded-[2.5rem] border border-[#f2f4f6] shadow-xl shadow-[#002045]/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-transparent">
            <thead>
              <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/40">
                <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest min-w-[280px]">Agent Profile</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Performance</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Trust Score</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f6]">
              {filteredAgents.map((agent) => {
                const agentProperties = properties.filter(p => p.hostId === agent.id);
                return (
                  <tr key={agent.id} className="hover:bg-[#f7f9fb]/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden relative border border-[#f2f4f6] shrink-0 bg-[#f7f9fb] flex items-center justify-center">
                          {agent.avatar ? (
                            <Image src={agent.avatar} alt={agent.name} fill className="object-cover" />
                          ) : (
                            <span className="text-sm font-black text-[#002045]">{agent.initials}</span>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-black text-[#002045] text-base tracking-tight mb-0.5 truncate">{agent.name}</p>
                          <p className="text-[10px] text-[#845326] font-bold uppercase tracking-wider">{agent.title}</p>
                          <p className="text-[9px] text-[#c4c6cf] font-medium uppercase tracking-[0.15em] shrink-0">{agent.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-[#002045] leading-none mb-1">{agentProperties.length}</p>
                       <p className="text-[9px] text-[#74777f] font-bold uppercase tracking-widest">Active Listings</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-1.5 mb-1">
                          <span className="material-symbols-outlined text-[#fab983] text-sm fill-1">star</span>
                          <span className="text-sm font-black text-[#002045]">{agent.rating || 'N/A'}</span>
                       </div>
                       <p className="text-[9px] text-[#74777f] font-bold uppercase tracking-widest">{agent.reviewCount || 0} Reviews</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${agent.isVerified ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-400'}`} />
                        <span className="text-[10px] font-black text-[#002045] uppercase tracking-widest">
                          {agent.isVerified ? 'Verified' : 'Reviewing'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                         <button className="h-10 w-10 rounded-xl flex items-center justify-center border border-[#f2f4f6] bg-white text-[#74777f] hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all">
                           <span className="material-symbols-outlined text-xl">block</span>
                         </button>
                         <button className="h-10 w-10 rounded-xl flex items-center justify-center border border-[#f2f4f6] bg-white text-[#002045] hover:bg-[#002045] hover:text-white transition-all shadow-sm">
                           <span className="material-symbols-outlined text-xl">settings_account_box</span>
                         </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
