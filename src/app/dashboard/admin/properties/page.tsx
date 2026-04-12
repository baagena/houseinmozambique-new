'use client';

import { useState } from 'react';
import { properties, agents } from '@/lib/dummyData';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminPropertiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || p.listingType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-10">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-[#f2f4f6] shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-[#002045] tracking-tighter mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
            All Properties
          </h1>
          <p className="text-xs font-bold text-[#74777f] uppercase tracking-widest">
            Managing <span className="text-[#002045]">{properties.length}</span> listings across the platform
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#c4c6cf] text-xl">search</span>
            <input 
              type="text" 
              placeholder="Search by title or location..."
              className="pl-12 pr-6 py-4 bg-[#f7f9fb] border-none rounded-2xl text-sm font-bold text-[#002045] placeholder-[#c4c6cf] w-full sm:w-80 focus:ring-4 focus:ring-[#002045]/5 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex bg-[#f7f9fb] p-1 rounded-2xl overflow-x-auto custom-scrollbar">
            {['All', 'Buy', 'Rent', 'Short Stay'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === t ? 'bg-[#002045] text-white shadow-lg' : 'text-[#74777f] hover:text-[#002045]'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] border border-[#f2f4f6] shadow-xl shadow-[#002045]/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-transparent">
            <thead>
              <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/40">
                <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest min-w-[300px]">Property Detail</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Listing Agent</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Price / Unit</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f6]">
              {filteredProperties.map((p) => {
                const agent = agents.find(a => a.id === p.hostId);
                return (
                  <tr key={p.id} className="hover:bg-[#f7f9fb]/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden relative border border-[#f2f4f6] shrink-0">
                          <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-black text-[#002045] text-base tracking-tight mb-0.5">{p.title}</p>
                          <p className="text-[10px] text-[#74777f] font-bold uppercase tracking-wider">{p.location.split(',')[0]} · {p.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.listingType === 'Buy' ? 'bg-[#845326]' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] font-black text-[#002045] uppercase tracking-widest whitespace-nowrap">
                          {p.listingType === 'Buy' ? 'For Sale' : p.listingType === 'Rent' ? 'To Rent' : 'Holiday'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-[#002045] flex items-center justify-center text-[9px] font-black text-white shrink-0">
                           {agent?.initials || '??'}
                         </div>
                         <div className="overflow-hidden">
                            <p className="text-xs font-black text-[#002045] leading-none mb-1 truncate">{agent?.name || 'Unknown'}</p>
                            <p className="text-[9px] text-[#c4c6cf] font-bold uppercase tracking-widest">Partner Agent</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-[#002045] leading-none mb-1 whitespace-nowrap">
                          ${p.price.toLocaleString()}
                       </p>
                       <p className="text-[9px] text-[#74777f] font-bold uppercase tracking-widest">Per {p.priceUnit || 'Unit'}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-3">
                         <button className="h-10 w-10 rounded-xl flex items-center justify-center border border-[#f2f4f6] bg-white text-[#74777f] hover:text-[#002045] hover:border-[#002045]/10 hover:shadow-lg transition-all">
                           <span className="material-symbols-outlined text-xl">visibility</span>
                         </button>
                         <button className="h-10 w-10 rounded-xl flex items-center justify-center border border-[#f2f4f6] bg-white text-[#845326] hover:bg-[#845326] hover:text-white transition-all shadow-sm">
                           <span className="material-symbols-outlined text-xl">edit_square</span>
                         </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="px-8 py-8 border-t border-[#f2f4f6] flex justify-between items-center bg-[#f7f9fb]/20">
           <p className="text-[10px] font-black text-[#c4c6cf] uppercase tracking-[0.2em]">Showing 1-{filteredProperties.length} of {filteredProperties.length} listings</p>
           <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg border border-[#f2f4f6] text-[10px] font-black uppercase text-[#c4c6cf] cursor-not-allowed">Prev</button>
              <button className="px-4 py-2 rounded-lg border border-[#002045] text-[10px] font-black uppercase text-[#002045]">Next</button>
           </div>
        </div>
      </div>
    </div>
  );
}
