'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBnVQfCtu9Dd90Gdaa2jDdkQ2z_Xeq6krQV6VJSeeyr13PvW80MmDQcH-QeJC6-1GKkzV5nE8eC-oB960jNWV5NYzaMhoQgOBB_ED4LDUKHYjKwZsumdyys8aRuChvRvDjuHfbLGt1QSdJYKQAeL8abuA-5Ig01BoaOcMtiY0uz_ScZ6QCDlYyJ86LBji7ohI7-8f8rVevJejxSG_Ix29FhghbOU5HOZO5N5eNnpEQybQLaXXWyNNLP6GDDoAs0pkHE0QaBbHYyynY';

export default function HomeHero() {
  const router = useRouter();
  const [listingType, setListingType] = useState<'Buy' | 'Rent'>('Buy');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('All Types');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (listingType) params.set('type', listingType);
    if (location) params.set('location', location);
    if (propertyType && propertyType !== 'All Types') params.set('propertyType', propertyType);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <section className="px-4 md:px-8 mb-16 pt-24 relative">
      <div className="max-w-7xl mx-auto relative rounded-[3rem] overflow-hidden min-h-[500px] md:min-h-[600px] flex items-center justify-center text-center">
        <div className="absolute inset-0 z-0 scale-105 hover:scale-100 transition-transform duration-1000">
          <Image src={HERO_IMG} alt="Luxury Villa in Mozambique" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-[#002045]/60 via-[#002045]/40 to-transparent" />
        </div>
        
        <div className="relative z-10 px-6 max-w-4xl w-full pb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black tracking-[0.3em] uppercase mb-8 animate-fade-in">
            Exclusive Real Estate
          </span>
          <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-[0.95] tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>
            Find Your<br />Perfect Estate
          </h1>
          <p className="text-white/80 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Discover the most prestigious and exclusive properties across the breathtaking landscapes of Mozambique.
          </p>
        </div>
      </div>

      {/* ── Search Bar Wrapper ── */}
      <div className="max-w-6xl mx-auto -mt-16 md:-mt-20 relative z-20 px-4">
        <div className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,32,69,0.15)] p-3 md:p-4 border border-white">
          <form
            onSubmit={handleSearch}
            className="flex flex-col lg:flex-row items-stretch gap-4"
          >
            {/* Buy / Rent Toggle */}
            <div className="bg-[#f2f4f6] rounded-2xl p-1.5 flex lg:w-fit">
              {(['Buy', 'Rent', 'Short Stay', 'Auction'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setListingType(t as any)}
                  className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 ${
                    listingType === t
                      ? 'bg-white shadow-lg text-[#002045]'
                      : 'text-[#43474e] hover:text-[#002045]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location */}
              <div className="relative group px-6 py-3 bg-[#f2f4f6]/50 rounded-2xl border border-transparent hover:border-[#002045]/10 hover:bg-white transition-all duration-300">
                <label className="text-[9px] font-black text-[#845326] uppercase tracking-[0.2em] block mb-1 opacity-60">
                  Location
                </label>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#002045] opacity-40">location_on</span>
                  <input
                    className="bg-transparent border-none p-0 focus:outline-none text-[#002045] placeholder-[#c4c6cf] w-full text-sm font-bold"
                    placeholder="Search city or enclave..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="relative group px-6 py-3 bg-[#f2f4f6]/50 rounded-2xl border border-transparent hover:border-[#002045]/10 hover:bg-white transition-all duration-300">
                <label className="text-[9px] font-black text-[#845326] uppercase tracking-[0.2em] block mb-1 opacity-60">
                  Property Asset
                </label>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#002045] opacity-40">roofing</span>
                  <select
                    className="bg-transparent border-none p-0 focus:outline-none text-[#002045] w-full text-sm font-bold appearance-none cursor-pointer"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                  >
                    {['All Types', 'Villa', 'Apartment', 'Penthouse', 'Land', 'Bungalow', 'Lodge'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#002045] text-[#febc85] px-10 py-5 rounded-[1.5rem] flex items-center justify-center hover:bg-[#003366] hover:shadow-[0_20px_40px_rgba(0,32,69,0.3)] transition-all duration-500 font-black text-xs tracking-widest uppercase gap-3"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span>Find Property</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
