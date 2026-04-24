'use client';

import { useState } from 'react';
import Image from 'next/image';
import AdminPropertyActions from './AdminPropertyActions';

interface PendingProperty {
  id: string;
  title: string;
  city: string;
  price: number;
  priceUnit: string;
  images: string[];
  createdAt: Date;
  host: {
    name: string;
    initials: string;
  };
}

interface NewAgent {
  id: string;
  name: string;
  initials: string;
  title: string;
  location: string;
  yearsExperience: number | null;
  specializations: string[];
  createdAt: Date;
  avatar: string | null;
}

interface Props {
  pendingProperties: PendingProperty[];
  newAgents: NewAgent[];
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return days === 1 ? 'Yesterday' : `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

function formatPrice(price: number, unit: string): string {
  const formatted = price >= 1000000
    ? `$${(price / 1000000).toFixed(1)}M`
    : price >= 1000
    ? `$${(price / 1000).toFixed(0)}k`
    : `$${price.toLocaleString()}`;
  if (unit === 'monthly') return `${formatted}/mo`;
  if (unit === 'nightly') return `${formatted}/nt`;
  return formatted;
}

export default function AdminApprovalsClient({ pendingProperties, newAgents }: Props) {
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
            {pendingProperties.length > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[8px] font-black ${activeTab === 'properties' ? 'bg-white/20 text-white' : 'bg-[#845326]/10 text-[#845326]'}`}>
                {pendingProperties.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all gap-3 flex items-center whitespace-nowrap ${activeTab === 'agents' ? 'bg-[#002045] text-white shadow-xl shadow-[#002045]/10' : 'text-[#74777f] hover:text-[#002045]'}`}
          >
            <span className="material-symbols-outlined text-lg">person_check</span>
            New Agents
            {newAgents.length > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[8px] font-black ${activeTab === 'agents' ? 'bg-white/20 text-white' : 'bg-[#845326]/10 text-[#845326]'}`}>
                {newAgents.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Queue Content */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-xs font-black text-[#74777f] uppercase tracking-widest">
            {activeTab === 'properties'
              ? `Awaiting Review (${pendingProperties.length})`
              : `Recently Joined (${newAgents.length})`}
          </h3>
        </div>

        {activeTab === 'properties' ? (
          <div className="grid grid-cols-1 gap-6">
            {pendingProperties.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[2rem] border border-[#f2f4f6]">
                <span className="material-symbols-outlined text-6xl text-[#f2f4f6] mb-4">check_circle</span>
                <p className="text-[#c4c6cf] font-black text-[10px] uppercase tracking-widest">No pending listings — all clear!</p>
              </div>
            ) : pendingProperties.map((listing) => (
              <div
                key={listing.id}
                className="bg-white p-8 rounded-[2rem] border border-[#f2f4f6] flex flex-col md:flex-row items-center gap-8 group hover:shadow-2xl hover:shadow-[#002045]/5 transition-all"
              >
                <div className="w-full md:w-32 h-32 rounded-2xl bg-[#f7f9fb] shrink-0 border border-[#f2f4f6] overflow-hidden relative">
                  {listing.images[0] ? (
                    <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <span className="material-symbols-outlined text-4xl">image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#fef9f2] text-[#845326] text-[8px] font-black uppercase tracking-widest">Pending Review</span>
                    <span className="text-[9px] font-bold text-[#c4c6cf] uppercase tracking-widest">{timeAgo(listing.createdAt)}</span>
                  </div>
                  <h4 className="text-xl font-black text-[#002045] tracking-tight">{listing.title}</h4>
                  <p className="text-xs font-bold text-[#74777f] uppercase tracking-wide">
                    {listing.city} · Submitted by <span className="text-[#002045]">{listing.host.name}</span>
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-xl font-black text-[#002045] mb-4">{formatPrice(listing.price, listing.priceUnit)}</p>
                  <AdminPropertyActions propertyId={listing.id} currentStatus="PENDING" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {newAgents.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[2rem] border border-[#f2f4f6]">
                <span className="material-symbols-outlined text-6xl text-[#f2f4f6] mb-4">group</span>
                <p className="text-[#c4c6cf] font-black text-[10px] uppercase tracking-widest">No new agent registrations this month.</p>
              </div>
            ) : newAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white p-8 rounded-[2.5rem] border border-[#f2f4f6] flex flex-col md:flex-row items-center gap-10 group hover:shadow-2xl hover:shadow-[#002045]/5 transition-all"
              >
                <div className="w-20 h-20 rounded-3xl bg-[#002045] shrink-0 flex items-center justify-center text-[#fab983] font-black text-xl overflow-hidden relative">
                  {agent.avatar ? (
                    <Image src={agent.avatar} alt={agent.name} fill className="object-cover" />
                  ) : (
                    <span>{agent.initials}</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#f7f9fb] text-[#002045] text-[8px] font-black uppercase tracking-widest">New Registration</span>
                    <span className="text-[9px] font-bold text-[#c4c6cf] uppercase tracking-widest">{timeAgo(agent.createdAt)}</span>
                  </div>
                  <h4 className="text-2xl font-black text-[#002045] tracking-tighter">{agent.name}</h4>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#74777f]">
                      <span className="material-symbols-outlined text-sm text-[#fab983]">location_on</span>
                      {agent.location}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#74777f]">
                      <span className="material-symbols-outlined text-sm text-[#fab983]">work_history</span>
                      {agent.yearsExperience ?? 0} Yrs Experience
                    </div>
                    {agent.specializations.length > 0 && (
                      <div className="flex items-center gap-2 text-xs font-bold text-[#74777f]">
                        <span className="material-symbols-outlined text-sm text-[#fab983]">stars</span>
                        {agent.specializations.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3 shrink-0">
                  <span className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-700 text-center">
                    Active Member
                  </span>
                  <p className="text-[9px] text-center text-[#c4c6cf] font-bold uppercase tracking-widest">{agent.title || 'Agent'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
