'use client';

import { useState } from 'react';
import { properties } from '@/lib/dummyData';
import Image from 'next/image';
import Link from 'next/link';

export default function AgentListingsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  // Filter for Ricardo Santos (agent-1)
  const myProperties = properties.filter(p => p.hostId === 'agent-1');

  return (
    <div className="space-y-10">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-10 rounded-[2.5rem] border border-[#f2f4f6] shadow-sm">
        <div className="max-w-xl">
          <h1 className="text-3xl font-black text-[#002045] tracking-tighter mb-3" style={{ fontFamily: 'var(--font-headline)' }}>
            My Curated Inventory
          </h1>
          <p className="text-[#74777f] font-medium font-serif leading-relaxed italic">
            Management hub for your professional real estate portfolio across Mozambique.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-[#f7f9fb] p-1.5 rounded-2xl overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#002045] text-white shadow-lg shadow-[#002045]/10' : 'text-[#c4c6cf] hover:text-[#002045]'}`}
            >
              <span className="material-symbols-outlined text-lg block">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'table' ? 'bg-[#002045] text-white shadow-lg shadow-[#002045]/10' : 'text-[#c4c6cf] hover:text-[#002045]'}`}
            >
              <span className="material-symbols-outlined text-lg block">view_list</span>
            </button>
          </div>
          
          <Link 
            href="/post-property" 
            className="flex items-center gap-2 bg-[#fab983] text-[#002045] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#fab983]/10 hover:-translate-y-1 transition-all active:scale-95 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-xl">add_box</span>
            Post New Listing
          </Link>
        </div>
      </div>

      {viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {myProperties.map((p) => (
            <div key={p.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-[#f2f4f6] group hover:shadow-2xl hover:shadow-[#002045]/5 transition-all">
              <div className="relative h-64 overflow-hidden">
                <Image src={p.images[0]} alt={p.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-black text-[#002045] uppercase tracking-widest shadow-sm">
                    {p.listingType}
                  </span>
                  {p.isFeatured && (
                    <span className="px-3 py-1 bg-[#002045]/90 backdrop-blur-md rounded-lg text-[9px] font-black text-[#fab983] uppercase tracking-widest shadow-sm">
                      Featured
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#002045]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                   <div className="flex gap-2 w-full">
                      <button className="flex-1 bg-white text-[#002045] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#fab983] transition-colors shadow-xl">
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Edit Details
                      </button>
                      <button className="h-11 w-11 bg-white/20 backdrop-blur-md text-white rounded-xl flex items-center justify-center hover:bg-white/40 transition-colors">
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </button>
                   </div>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <div>
                   <h3 className="text-xl font-black text-[#002045] tracking-tight group-hover:text-[#845326] transition-colors line-clamp-1">{p.title}</h3>
                   <p className="text-[10px] text-[#74777f] font-bold uppercase tracking-widest">{p.location.split(',')[0]} · {p.type}</p>
                </div>
                <div className="flex justify-between items-center py-4 border-t border-[#f2f4f6]">
                   <div className="flex flex-col">
                      <span className="text-lg font-black text-[#002045] leading-none mb-1 translate-x-[0.5px]">${p.price.toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-[#c4c6cf] uppercase tracking-widest leading-none">Monthly Rent</span>
                   </div>
                   <div className="flex items-center gap-4 text-[#74777f]">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                         <span className="material-symbols-outlined text-lg">visibility</span>
                         120
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#fab983]">
                         <span className="material-symbols-outlined text-lg fill-1">star</span>
                         4.9
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Table View
        <div className="bg-white rounded-[2.5rem] border border-[#f2f4f6] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-transparent">
              <thead>
                <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/50">
                  <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest min-w-[300px]">Listing Detail</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Performance</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Pricing</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Visibility</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6]">
                {myProperties.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f7f9fb]/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden relative border border-[#f2f4f6] shrink-0">
                          <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-black text-[#002045] text-base tracking-tight mb-0.5">{p.title}</p>
                          <p className="text-[10px] text-[#74777f] font-bold uppercase tracking-wider">{p.type} · {p.listingType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          <span className="text-[10px] font-black text-[#002045] uppercase tracking-widest">Live</span>
                       </div>
                       <p className="text-[9px] text-[#c4c6cf] font-medium uppercase tracking-[0.15em] whitespace-nowrap">Last updated 24h ago</p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-[#002045] leading-none mb-1 whitespace-nowrap">${p.price.toLocaleString()}</p>
                       <p className="text-[9px] text-[#74777f] font-bold uppercase tracking-widest">{p.priceUnit}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#74777f]">
                             <span className="material-symbols-outlined text-sm text-[#fab983]">visibility</span>
                             120 Views
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#74777f]">
                             <span className="material-symbols-outlined text-sm text-pink-400">favorite</span>
                             15 Saves
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                         <button className="h-10 w-10 rounded-xl flex items-center justify-center border border-[#f2f4f6] bg-white text-[#74777f] hover:text-[#002045] hover:border-[#002045]/10 transition-all">
                           <span className="material-symbols-outlined text-xl">share</span>
                         </button>
                         <button className="h-10 w-10 rounded-xl flex items-center justify-center border border-[#f2f4f6] bg-white text-[#845326] hover:bg-[#845326] hover:text-white transition-all shadow-sm">
                           <span className="material-symbols-outlined text-xl">edit</span>
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
