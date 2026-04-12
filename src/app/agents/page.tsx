'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { agents, getFeaturedAgents } from '@/lib/dummyData';

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState('All');

  const featured = getFeaturedAgents();
  const alphabet = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  const filtered = agents.filter((a) => {
    const matchesSearch = searchQuery
      ? a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesLetter =
      activeLetter === 'All' ? true : a.name.startsWith(activeLetter);
    return matchesSearch && matchesLetter;
  });

  const allAgents = filtered.filter((a) => !a.isFeatured || activeLetter !== 'All' || searchQuery);

  return (
    <div className="pt-32 pb-24 bg-[#f7f9fb]">
      {/* Header */}
      <header className="max-w-4xl mx-auto text-center px-6 mb-16">
        <h1
          className="text-5xl font-extrabold tracking-tight text-[#002045] mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Find Your Professional Agent in Mozambique
        </h1>
        <p className="text-lg text-[#43474e] max-w-2xl mx-auto font-medium">
          Our curated directory of real estate experts is here to guide you through Mozambique&apos;s most exclusive property opportunities with integrity and local insight.
        </p>
      </header>

      {/* Search */}
      <section className="max-w-3xl mx-auto px-6 mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[#74777f]">location_on</span>
          </div>
          <input
            className="w-full pl-16 pr-8 py-6 rounded-xl bg-[#e0e3e5] border-none focus:outline-none focus:ring-2 focus:ring-[#002045] text-lg shadow-sm placeholder:text-[#43474e]/60"
            placeholder="Search by name or location (e.g., Maputo, Beira)"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-2 right-2">
            <button className="h-full px-8 bg-[#002045] text-white rounded-lg font-bold hover:bg-[#1a365d] transition-all">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* A-Z Filter */}
      {/* <section className="max-w-4xl mx-auto px-6 mb-20 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max py-2">
          <span className="text-sm font-bold text-[#43474e] mr-4">FILTER BY NAME:</span>
          <div className="flex gap-1">
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => setActiveLetter(letter)}
                className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm transition-colors ${
                  activeLetter === letter
                    ? 'bg-[#002045] text-white'
                    : 'hover:bg-[#e6e8ea] text-[#43474e]'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </section> */}

      {/* Featured Agents */}
      {!searchQuery && activeLetter === 'All' && (
        <section className="max-w-[1440px] mx-auto px-8 mb-24">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-3xl font-extrabold text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
              Featured Agents
            </h2>
            <div className="h-px flex-grow bg-[#f2f4f6]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {featured.map((agent) => (
              <AgentCard key={agent.id} agent={agent} size="large" />
            ))}
          </div>
        </section>
      )}

      {/* All Agents */}
      <section className="max-w-[1440px] mx-auto px-8 mb-24">
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-3xl font-extrabold text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
            {searchQuery || activeLetter !== 'All' ? `Results (${filtered.length})` : 'All Agents (A-Z)'}
          </h2>
          <div className="h-px flex-grow bg-[#f2f4f6]" />
        </div>

        {(searchQuery || activeLetter !== 'All' ? filtered : allAgents).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {(searchQuery || activeLetter !== 'All' ? filtered : allAgents).map((agent) => (
              <AgentCard key={agent.id} agent={agent} size="small" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-[#c4c6cf]">person_search</span>
            <p className="text-[#43474e] mt-4 font-medium">No agents found matching your search.</p>
          </div>
        )}

        <div className="mt-16 flex justify-center">
          <button className="px-10 py-4 bg-[#eceef0] border border-[#c4c6cf]/15 text-[#002045] font-bold rounded-lg hover:bg-[#e6e8ea] transition-all">
            Load More Agents
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1440px] mx-auto px-8 mb-24">
        <div className="relative rounded-3xl overflow-hidden bg-[#1a365d] text-white p-12 md:p-20 shadow-2xl">
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-20 pointer-events-none hidden lg:block">
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 200 200">
              <path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.3,87,-15.7,86.1,-0.5C85.2,14.6,80,29.3,71.7,42.1C63.4,54.9,52,65.8,38.9,73.5C25.8,81.2,12.9,85.6,-1.1,87.6C-15.1,89.5,-30.2,88.9,-44,83.1C-57.8,77.3,-70.2,66.2,-78.4,52.6C-86.6,39.1,-90.6,23.1,-90.6,7.1C-90.6,-8.9,-86.6,-24.9,-78.4,-38.5C-70.2,-52,-57.8,-63.1,-44,-70.3C-30.2,-77.5,-15.1,-80.7,-0.5,-79.8C14,-78.9,28.1,-73.9,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight" style={{ fontFamily: 'var(--font-headline)' }}>
              Become a Host or Agent
            </h2>
            <p className="text-xl text-[#86a0cd] mb-10 leading-relaxed font-medium">
              Elevate your professional journey with the most prestigious real estate network in Mozambique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/post-property" className="bg-[#845326] text-white px-8 py-4 rounded-xl font-extrabold text-lg shadow-xl hover:-translate-y-0.5 transition-all text-center">
                List Your Property
              </Link>
              <Link href="/auth/agent-register" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-extrabold text-lg hover:bg-white/20 transition-all text-center">
                Join as an Agent
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface AgentCardProps {
  agent: ReturnType<typeof getFeaturedAgents>[number];
  size: 'large' | 'small';
}

function AgentCard({ agent, size }: AgentCardProps) {
  const isLarge = size === 'large';
  return (
    <div className={`bg-white rounded-xl ${isLarge ? 'p-6' : 'p-4'} text-center shadow-sm hover:shadow-md transition-shadow group`}>
      <div className={`relative ${isLarge ? 'w-24 h-24' : 'w-16 h-16'} mx-auto mb-3`}>
        {agent.avatar ? (
          <Image
            src={agent.avatar}
            alt={agent.name}
            width={isLarge ? 96 : 64}
            height={isLarge ? 96 : 64}
            className={`w-full h-full object-cover rounded-full ring-4 ring-[#f2f4f6] group-hover:ring-[#febc85] transition-all`}
          />
        ) : (
          <div className={`w-full h-full rounded-full bg-[#e6e8ea] flex items-center justify-center text-[#002045] font-bold ${isLarge ? 'text-xl' : 'text-sm'}`}>
            {agent.initials}
          </div>
        )}
        {agent.isVerified && (
          <div className="absolute -bottom-1 -right-1 bg-[#845326] text-white rounded-full p-1 border-2 border-white">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        )}
      </div>

      <h3 className={`font-bold text-[#191c1e] ${isLarge ? 'text-base' : 'text-sm'}`} style={{ fontFamily: 'var(--font-headline)' }}>
        {agent.name}
      </h3>
      <p className={`text-[#845326] font-bold uppercase tracking-wider mb-2 ${isLarge ? 'text-xs' : 'text-[10px]'}`}>
        {agent.title}
      </p>
      <div className={`flex items-center justify-center gap-1 mb-3 ${isLarge ? '' : 'mb-2'}`}>
        <span className="material-symbols-outlined text-sm text-[#febc85]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        <span className={`font-bold ${isLarge ? 'text-sm' : 'text-xs'}`}>{agent.rating}</span>
      </div>
      <p className={`text-[#43474e] flex items-center justify-center gap-1 mb-4 ${isLarge ? 'text-xs' : 'text-[10px]'}`}>
        <span className={`material-symbols-outlined ${isLarge ? 'text-[14px]' : 'text-[12px]'}`}>location_on</span>
        {agent.location}
      </p>
      <div className={`flex items-center justify-center text-[#002045] ${isLarge ? 'gap-4' : 'gap-2'}`}>
        {(['call', 'chat', 'alternate_email'] as const).map((icon) => (
          <button
            key={icon}
            className={`${isLarge ? 'p-2' : 'p-1.5'} hover:bg-[#002045]/5 rounded-full transition-colors`}
          >
            <span className={`material-symbols-outlined ${isLarge ? 'text-xl' : 'text-lg'}`}>{icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
