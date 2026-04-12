'use client';

import { useState } from 'react';

export default function AdminApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'agents' | 'properties'>('properties');

  return (
    <div className="space-y-12">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-10 rounded-[2.5rem] border border-[#f2f4f6] shadow-sm">
        <div className="max-w-xl">
          <h1 className="text-3xl font-black text-[#002045] tracking-tighter mb-3" style={{ fontFamily: 'var(--font-headline)' }}>
            Quality Assurance Queue
          </h1>
          <p className="text-[#74777f] font-medium font-serif leading-relaxed italic">
            Review and verify new submissions to ensure the prestigious standards of HouseinMozambique are maintained.
          </p>
        </div>

        <div className="flex bg-[#f7f9fb] p-1.5 rounded-3xl shrink-0 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all gap-3 flex items-center whitespace-nowrap ${activeTab === 'properties' ? 'bg-[#002045] text-white shadow-xl shadow-[#002045]/10' : 'text-[#74777f] hover:text-[#002045]'}`}
          >
            <span className="material-symbols-outlined text-lg">domain</span>
            New Listings
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all gap-3 flex items-center whitespace-nowrap ${activeTab === 'agents' ? 'bg-[#002045] text-white shadow-xl shadow-[#002045]/10' : 'text-[#74777f] hover:text-[#002045]'}`}
          >
            <span className="material-symbols-outlined text-lg">person_check</span>
            Agent Applications
          </button>
        </div>
      </div>

      {/* Queue Content */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-xs font-black text-[#74777f] uppercase tracking-widest">
            Awaiting Review ({activeTab === 'properties' ? '4' : '2'})
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'properties' ? (
            // New Listings Queue
            [
              { title: 'Modern Cliffside Penthouse', loc: 'Costa do Sol', agent: 'Sofia Tembe', price: '$850k', date: '45m ago' },
              { title: 'Traditional Polana Manor', loc: 'Polana Cimento', agent: 'Ricardo Santos', price: '$1.2M', date: '2h ago' },
              { title: 'Matola Industrial Loft', loc: 'Matola', agent: 'Elena Matusse', price: '$3.5k/mo', date: '5h ago' },
              { title: 'Inhambane Beachfront', loc: 'Tofo', agent: 'Lucas Mondlane', price: '$450/nt', date: 'Yesterday' },
            ].map((listing, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-[#f2f4f6] flex flex-col md:flex-row items-center gap-8 group hover:shadow-2xl hover:shadow-[#002045]/5 transition-all">
                <div className="w-full md:w-32 h-32 rounded-2xl bg-[#f7f9fb] shrink-0 border border-[#f2f4f6] overflow-hidden relative">
                   <div className="absolute inset-0 flex items-center justify-center opacity-20">
                     <span className="material-symbols-outlined text-4xl">image</span>
                   </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#fef9f2] text-[#845326] text-[8px] font-black uppercase tracking-widest">Pending Review</span>
                    <span className="text-[9px] font-bold text-[#c4c6cf] uppercase tracking-widest">{listing.date}</span>
                  </div>
                  <h4 className="text-xl font-black text-[#002045] tracking-tight">{listing.title}</h4>
                  <p className="text-xs font-bold text-[#74777f] uppercase tracking-wide">{listing.loc} · Submitted by <span className="text-[#002045]">{listing.agent}</span></p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-xl font-black text-[#002045] mb-4">{listing.price}</p>
                  <div className="flex gap-3">
                    <button className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors">Reject</button>
                    <button className="h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95">Verify & Post</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Agent Applications Queue
            [
              { name: 'Bernardo Matola', spec: 'Industrial Real Estate', exp: '12 Years', date: '2h ago' },
              { name: 'Isabel Langa', spec: 'Coastal Retreats', exp: '4 Years', date: '5h ago' },
            ].map((agent, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-[#f2f4f6] flex flex-col md:flex-row items-center gap-10 group hover:shadow-2xl hover:shadow-[#002045]/5 transition-all">
                <div className="w-20 h-20 rounded-3xl bg-[#002045] shrink-0 flex items-center justify-center text-[#fab983] font-black text-xl">
                  {agent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#f7f9fb] text-[#002045] text-[8px] font-black uppercase tracking-widest">New Application</span>
                    <span className="text-[9px] font-bold text-[#c4c6cf] uppercase tracking-widest">{agent.date}</span>
                  </div>
                  <h4 className="text-2xl font-black text-[#002045] tracking-tighter">{agent.name}</h4>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#74777f]">
                      <span className="material-symbols-outlined text-sm text-[#fab983]">stars</span>
                      {agent.spec}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#74777f]">
                      <span className="material-symbols-outlined text-sm text-[#fab983]">history_edu</span>
                      {agent.exp} Experience
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 shrink-0">
                   <button className="h-12 px-10 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#002045] text-white shadow-lg shadow-[#002045]/10 hover:scale-105 transition-all active:scale-95">Approve Partner</button>
                   <button className="h-12 px-10 rounded-xl font-black text-[10px] uppercase tracking-widest text-[#74777f] hover:bg-[#f7f9fb] transition-colors">Request Info</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
