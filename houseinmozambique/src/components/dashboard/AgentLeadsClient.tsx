'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface Lead {
  id: string;
  name: string;
  subject: string;
  message: string;
  email: string;
  createdAt: string;
}

interface AgentLeadsClientProps {
  myInquiries: Lead[];
}

export default function AgentLeadsClient({ myInquiries }: AgentLeadsClientProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string>('All');

  // Let's filter inquiries. Since we don't have separate statuses inside the Inquiry schema yet (or we can filter by read/unread status)
  // we'll filter by read/unread.
  const filteredLeads = myInquiries.filter(l => {
    if (filter === 'All') return true;
    // We can define custom filters if needed, or just list all of them
    return true;
  });

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
          {['All'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-[#002045] text-white shadow-xl shadow-[#002045]/10`}
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
              <div className="w-16 h-16 rounded-3xl bg-[#f7f9fb] shrink-0 flex items-center justify-center text-[#002045] font-black text-lg border border-[#f2f4f6] group-hover:bg-[#002045] group-hover:text-white transition-colors translate-x-[0.5px]">
                {lead.name.split(' ').map(n => n[0]).join('')}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                   <h4 className="text-xl font-black text-[#002045] tracking-tight">{lead.name}</h4>
                   <span className="text-[9px] font-bold text-[#c4c6cf] uppercase tracking-widest ml-auto md:ml-0">
                     {new Date(lead.createdAt).toLocaleDateString()}
                   </span>
                </div>
                <div>
                   <p className="text-[10px] font-black text-[#845326] uppercase tracking-widest mb-1">Inquiry on <span className="text-[#002045]">{lead.subject}</span></p>
                   <p className="text-sm text-[#74777f] font-medium leading-relaxed max-w-2xl line-clamp-1 group-hover:line-clamp-none transition-all">
                     "{lead.message}"
                   </p>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto shrink-0">
                 <a
                    href={`mailto:${lead.email}?subject=${encodeURIComponent(`Reply: ${lead.subject}`)}&body=${encodeURIComponent(`Hello ${lead.name},\n\nThank you for reaching out. Regarding your inquiry: "${lead.message}"\n\nHow can I best assist you?\n\nBest regards,\n`)}`}
                    className="flex-1 md:flex-none h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#002045] text-white shadow-xl shadow-[#002045]/10 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                   <span className="material-symbols-outlined text-sm">reply</span>
                   Contact
                 </a>
                 <button
                   onClick={async () => {
                     // mark as read
                     await fetch(`/api/inquiries/${lead.id}/read`, { method: 'POST', credentials: 'include' });
                     location.reload();
                   }}
                   className="h-12 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#f7f9fb] border border-[#f2f4f6] text-[#002045] ml-2"
                 >
                   Mark read
                 </button>
                 <button
                   onClick={async () => {
                     if (!confirm('Delete this inquiry?')) return;
                     await fetch(`/api/inquiries/${lead.id}/delete`, { method: 'DELETE', credentials: 'include' });
                     location.reload();
                   }}
                   className="h-12 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-red-50 text-red-600 ml-2"
                 >
                   Delete
                 </button>
              </div>
            </div>
          ))}
          {filteredLeads.length === 0 && (
            <p className="text-sm text-[#74777f] font-medium italic text-center py-12">No active inquiries found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
