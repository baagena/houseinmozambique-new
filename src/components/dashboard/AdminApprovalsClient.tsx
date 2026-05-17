'use client';

import { useState } from 'react';
import Image from 'next/image';
import AdminPropertyActions from './AdminPropertyActions';

interface PendingProperty {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  price: number;
  priceUnit: string;
  type: string;
  listingType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  images: string[];
  createdAt: Date;
  host: {
    name: string;
    initials: string;
    title: string;
    location: string;
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
  const [selectedProperty, setSelectedProperty] = useState<PendingProperty | null>(null);

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
                <div className="text-left shrink-0 space-y-4">
                  <p className="text-xl font-black text-[#002045] mb-4">{formatPrice(listing.price, listing.priceUnit)}</p>
                  <AdminPropertyActions
                    propertyId={listing.id}
                    currentStatus="PENDING"
                    onView={() => setSelectedProperty(listing)}
                  />
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

      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute right-4 top-4 text-[#74777f] hover:text-[#002045] text-xl font-black cursor-pointer"
            >
              ×
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 p-8">
              <div className="rounded-[2rem] overflow-hidden bg-[#f7f9fb] border border-[#f2f4f6] shadow-sm h-full">
                {selectedProperty.images[0] ? (
                  <div className="relative h-80 w-full">
                    <Image src={selectedProperty.images[0]} alt={selectedProperty.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-80 items-center justify-center text-[#c4c6cf]">
                    <span className="material-symbols-outlined text-6xl">image</span>
                  </div>
                )}
                <div className="space-y-4 p-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#845326]">Host</p>
                    <p className="text-base font-black text-[#002045]">{selectedProperty.host.name}</p>
                    <p className="text-sm text-[#74777f]">{selectedProperty.host.title || selectedProperty.host.location}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#74777f]">Listing Type</p>
                    <p className="text-base font-black text-[#002045]">{selectedProperty.listingType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#74777f]">Property Type</p>
                    <p className="text-base font-black text-[#002045]">{selectedProperty.type}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-black text-[#002045] tracking-tight">{selectedProperty.title}</h2>
                      <p className="text-sm text-[#74777f] mt-2">{selectedProperty.city}{selectedProperty.neighborhood ? ` · ${selectedProperty.neighborhood}` : ''}</p>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-[#fef9f2] text-[#845326] text-[11px] font-black uppercase tracking-widest">Pending Review</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-[#f2f4f6] p-4 bg-[#fafbfc]">
                      <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Price</p>
                      <p className="text-xl font-black text-[#002045]">{formatPrice(selectedProperty.price, selectedProperty.priceUnit)}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-[#f2f4f6] p-4 bg-[#fafbfc]">
                      <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Size</p>
                      <p className="text-xl font-black text-[#002045]">{selectedProperty.area} m²</p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-[1.5rem] border border-[#f2f4f6] p-6 bg-[#fafbfc]">
                    <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Full Description</p>
                    <p className="text-sm leading-relaxed text-[#4b5363]">{selectedProperty.description}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-[#f2f4f6] p-4 bg-[#fafbfc]">
                      <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Bedrooms</p>
                      <p className="text-lg font-black text-[#002045]">{selectedProperty.bedrooms}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-[#f2f4f6] p-4 bg-[#fafbfc]">
                      <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Bathrooms</p>
                      <p className="text-lg font-black text-[#002045]">{selectedProperty.bathrooms}</p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.5rem] border border-[#f2f4f6] p-6 bg-[#fafbfc]">
                    <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Location</p>
                    <p className="text-sm text-[#4b5363]">{selectedProperty.address ?? 'Address not provided'}</p>
                    {selectedProperty.neighborhood && <p className="text-sm text-[#4b5363]">Neighborhood: {selectedProperty.neighborhood}</p>}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProperty.amenities.length > 0 ? (
                        selectedProperty.amenities.map((amenity) => (
                          <span key={amenity} className="rounded-full bg-[#f7f9fb] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#002045]">
                            {amenity}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[#74777f]">No amenities listed.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
