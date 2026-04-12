'use client';

import { useState } from 'react';

interface Lead {
  id: string;
  name: string;
  property: string;
  message: string;
  date: string;
  status: 'New' | 'Contacted' | 'Viewing Scheduled' | 'Closed';
}

const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'Adolfo Macamo', property: 'Polana Sands Villa', message: 'Hello, I am interested in this property. Is it available for viewing this weekend?', date: '20m ago', status: 'New' },
  { id: '2', name: 'Celia Guambe', property: 'Costa do Sol Apt', message: 'What is the minimum lease term for this apartment? Does it include utilities?', date: '1h ago', status: 'Contacted' },
  { id: '3', name: 'Xavier Tembe', property: 'Sommerschield Loft', message: 'I would like to make an offer. Are you open to a 5% negotiation on the monthly rate?', date: '4h ago', status: 'Viewing Scheduled' },
  { id: '4', name: 'Maria Santos', property: 'Bazaruto Azure Retreat', message: 'Is the pool heated? We have young children and want to ensure safety.', date: '1d ago', status: 'Closed' },
  { id: '5', name: 'Jose Mondlane', property: 'Modern 3BR Villa', message: 'Does the security include armed guards? Please provide details on the compound.', date: '2d ago', status: 'New' },
];

export default function AgentLeadsPage() {
  const [filter, setFilter] = useState<string>('All');

  const filteredLeads = MOCK_LEADS.filter(l => filter === 'All' || l.status === filter);

  return (
    <div className="space-y-12">
      {/* Header & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-10 rounded-[2.5rem] border border-[#f2f4f6] shadow-sm">
        <div className="max-w-xl">
          <h1 className="text-3xl font-black text-[#002045] tracking-tighter mb-3" style={{ fontFamily: 'var(--font-headline)' }}>
            Client Relationship Hub
          </h1>
          <p className="text-[#74777f] font-medium font-serif leading-relaxed italic">
            Monitor and manage your active inquiries from potential buyers and renters.
          </p>
        </div>

        <div className="flex bg-[#f7f9fb] p-1.5 rounded-3xl shrink-0 overflow-x-auto custom-scrollbar">
          {['All', 'New', 'Contacted', 'Viewing Scheduled'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === s ? 'bg-[#002045] text-white shadow-xl shadow-[#002045]/10' : 'text-[#74777f] hover:text-[#002045]'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-6">
        <h3 className="text-xs font-black text-[#c4c6cf] uppercase tracking-[0.2em] px-4">
          Active Inquiries ({filteredLeads.length})
        </h3>

        <div className="grid grid-cols-1 gap-6">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-white p-8 rounded-[2rem] border border-[#f2f4f6] flex flex-col md:flex-row items-start md:items-center gap-8 group hover:shadow-2xl hover:shadow-[#002045]/5 transition-all relative overflow-hidden">
              {lead.status === 'New' && (
                <div className="absolute top-0 left-0 w-1 h-full bg-[#fab983]" />
              )}
              
              <div className="w-16 h-16 rounded-3xl bg-[#f7f9fb] shrink-0 flex items-center justify-center text-[#002045] font-black text-lg border border-[#f2f4f6] group-hover:bg-[#002045] group-hover:text-white transition-colors translate-x-[0.5px]">
                {lead.name.split(' ').map(n => n[0]).join('')}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                   <h4 className="text-xl font-black text-[#002045] tracking-tight">{lead.name}</h4>
                   <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${lead.status === 'New' ? 'bg-[#fef9f2] text-[#845326]' : 'bg-[#f7f9fb] text-[#74777f]'}`}>
                      {lead.status}
                   </span>
                   <span className="text-[9px] font-bold text-[#c4c6cf] uppercase tracking-widest ml-auto md:ml-0">{lead.date}</span>
                </div>
                <div>
                   <p className="text-[10px] font-black text-[#845326] uppercase tracking-widest mb-1">Inquiry on <span className="text-[#002045]">{lead.property}</span></p>
                   <p className="text-sm text-[#74777f] font-medium leading-relaxed max-w-2xl line-clamp-1 group-hover:line-clamp-none transition-all">
                     "{lead.message}"
                   </p>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto shrink-0">
                 <button className="flex-1 md:flex-none h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest border border-[#f2f4f6] text-[#74777f] hover:text-[#002045] hover:border-[#002045]/10 transition-all shadow-sm">
                   View Detail
                 </button>
                 <button className="flex-1 md:flex-none h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#002045] text-white shadow-xl shadow-[#002045]/10 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2">
                   <span className="material-symbols-outlined text-sm">reply</span>
                   Contact
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
