'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PropertyCard from '@/components/properties/PropertyCard';
import CategoryCarousel from '@/components/properties/CategoryCarousel';
import {
  getFeaturedProperties,
  getPropertiesByCity,
  properties,
  formatPrice,
} from '@/lib/dummyData';

const HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBnVQfCtu9Dd90Gdaa2jDdkQ2z_Xeq6krQV6VJSeeyr13PvW80MmDQcH-QeJC6-1GKkzV5nE8eC-oB960jNWV5NYzaMhoQgOBB_ED4LDUKHYjKwZsumdyys8aRuChvRvDjuHfbLGt1QSdJYKQAeL8abuA-5Ig01BoaOcMtiY0uz_ScZ6QCDlYyJ86LBji7ohI7-8f8rVevJejxSG_Ix29FhghbOU5HOZO5N5eNnpEQybQLaXXWyNNLP6GDDoAs0pkHE0QaBbHYyynY';

export default function HomePage() {
  const router = useRouter();
  const [listingType, setListingType] = useState<'Buy' | 'Rent'>('Buy');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('All Types');

  const featured = getFeaturedProperties();
  const maputoProps = getPropertiesByCity('Maputo');
  const inhamProps = getPropertiesByCity('Inhambane');
  const beiraProps = getPropertiesByCity('Beira');
  const nampulaProps = getPropertiesByCity('Nampula');
  const teteProps = getPropertiesByCity('Tete');
  const pembaProps = getPropertiesByCity('Pemba');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (listingType) params.set('type', listingType);
    if (location) params.set('location', location);
    if (propertyType && propertyType !== 'All Types') params.set('propertyType', propertyType);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="px-4 md:px-8 mb-16 pt-24">
        <div className="max-w-7xl mx-auto relative rounded-3xl overflow-hidden min-h-[600px] flex items-center justify-center text-center">
          <div className="absolute inset-0 z-0">
            <Image src={HERO_IMG} alt="Luxury Villa in Mozambique" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="relative z-10 px-6 max-w-4xl w-full">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-10 leading-[1.1] tracking-tight">
              Find your perfect home in Mozambique
            </h1>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="bg-white/95 backdrop-blur-xl p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row items-stretch gap-2"
            >
              {/* Buy / Rent Toggle */}
              <div className="bg-[#e6e8ea] rounded-xl p-1 flex">
                {(['Buy', 'Rent'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setListingType(t)}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                      listingType === t
                        ? 'bg-white shadow-sm text-[#002045]'
                        : 'text-[#43474e] hover:text-[#002045]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col md:flex-row gap-2">
                {/* Location */}
                <div className="flex-1 px-4 py-2 border-r border-[#c4c6cf]/30 text-left">
                  <label className="text-[10px] font-bold text-[#002045] uppercase tracking-widest block mb-1">
                    Location
                  </label>
                  <input
                    className="bg-transparent border-none p-0 focus:outline-none text-[#191c1e] placeholder-[#43474e] w-full text-sm font-medium"
                    placeholder="Where are you looking?"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                {/* Property Type */}
                <div className="flex-1 px-4 py-2 text-left">
                  <label className="text-[10px] font-bold text-[#002045] uppercase tracking-widest block mb-1">
                    Property Type
                  </label>
                  <select
                    className="bg-transparent border-none p-0 focus:outline-none text-[#191c1e] w-full text-sm font-medium appearance-none cursor-pointer"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                  >
                    {['All Types', 'Villa', 'Apartment', 'Penthouse', 'Land', 'Bungalow', 'Lodge'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#845326] text-white px-8 py-3 rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity font-bold gap-2"
              >
                <span className="material-symbols-outlined">search</span>
                <span>Search</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-24 pb-24">

        {/* ── Featured Collection ── */}
        <CategoryCarousel
          title="Featured Collection"
          badge="Curated Picks"
          properties={featured}
          seeAllUrl="/properties?isFeatured=true"
          subtitle="A selection of our most prestigious and exclusive listings"
        />

        {/* ── Explore by Location ── */}
        <div className="space-y-24">
          <section className="space-y-24">
            <div>
              <h2 className="text-4xl font-bold text-[#191c1e]">
                Explore by Location
              </h2>
              <p className="text-[#43474e] mt-2">Discover properties in the most desirable regions of Mozambique</p>
            </div>

            <CategoryCarousel
                title="Homes in Maputo"
                properties={maputoProps}
                seeAllUrl="/properties?location=Maputo"
                subtitle="Discover luxury living in the heart of Mozambique's capital"
            />

            <CategoryCarousel
                title="Port-side Luxury in Beira"
                properties={beiraProps}
                seeAllUrl="/properties?location=Beira"
                subtitle="Premium residences near the historic port district"
            />

            <CategoryCarousel
                title="Northern Hub Nampula"
                properties={nampulaProps}
                seeAllUrl="/properties?location=Nampula"
                subtitle="Exclusive opportunities in the north"
            />

            <CategoryCarousel
                title="Prime Tete"
                properties={teteProps}
                seeAllUrl="/properties?location=Tete"
                subtitle="High-growth opportunities in the industrial capital"
            />

            <CategoryCarousel
                title="Pristine Pemba"
                properties={pembaProps}
                seeAllUrl="/properties?location=Pemba"
                subtitle="Luxury waterfront living in the far north"
            />
          </section>

          {/* Inhambane Grid (kept as grid for layout variety) */}
          <div className="space-y-8 pb-12">
            <Link href="/properties?location=Inhambane" className="flex items-center gap-2 group cursor-pointer w-fit">
              <h3 className="text-2xl font-bold text-[#191c1e]">
                Beachfront in Inhambane
              </h3>
              <span className="material-symbols-outlined text-[#43474e] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
            <p className="text-[#43474e] -mt-6 text-sm">A collection of independent and handpicked retreats</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {inhamProps.slice(0, 4).map((p) => (
                <PropertyCard key={p.id} property={p} hideLocation={true} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Lists ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-[#c4c6cf]/20">
          {/* Rent */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold border-l-4 border-[#002045] pl-4">
              Rent
            </h3>
            <div className="h-[480px] overflow-y-auto pr-4 custom-scrollbar space-y-4">
              {properties.filter((p) => p.listingType === 'Rent').slice(0, 8).map((p) => (
                <PropertyCard key={p.id} property={p} variant="compact" />
              ))}
            </div>
          </div>

          {/* Buy */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold border-l-4 border-[#845326] pl-4">
              Buy
            </h3>
            <div className="h-[480px] overflow-y-auto pr-4 custom-scrollbar space-y-4">
              {properties.filter((p) => p.listingType === 'Buy').slice(0, 8).map((p) => (
                <PropertyCard key={p.id} property={p} variant="compact" />
              ))}
            </div>
          </div>

          {/* Short Stay */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold border-l-4 border-[#480600] pl-4">
              Short Stay
            </h3>
            <div className="h-[480px] overflow-y-auto pr-4 custom-scrollbar space-y-4">
              {properties.filter((p) => p.listingType === 'Short Stay').slice(0, 8).map((p) => (
                <PropertyCard key={p.id} property={p} variant="compact" />
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <section className="relative rounded-[3rem] overflow-hidden bg-[#1a365d] text-white p-12 md:p-20">
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-20 pointer-events-none hidden lg:block">
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 200 200">
              <path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.3,87,-15.7,86.1,-0.5C85.2,14.6,80,29.3,71.7,42.1C63.4,54.9,52,65.8,38.9,73.5C25.8,81.2,12.9,85.6,-1.1,87.6C-15.1,89.5,-30.2,88.9,-44,83.1C-57.8,77.3,-70.2,66.2,-78.4,52.6C-86.6,39.1,-90.6,23.1,-90.6,7.1C-90.6,-8.9,-86.6,-24.9,-78.4,-38.5C-70.2,-52,-57.8,-63.1,-44,-70.3C-30.2,-77.5,-15.1,-80.7,-0.5,-79.8C14,-78.9,28.1,-73.9,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              Become an Estate Curator
            </h2>
            <p className="text-xl text-[#86a0cd] mb-10 leading-relaxed">
              Join the most prestigious real estate network in Mozambique. List your property with us and reach high-intent buyers and renters looking for premium living experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/pricing"
                className="bg-[#845326] text-white px-8 py-4 rounded-xl font-extrabold text-lg shadow-xl hover:-translate-y-0.5 transition-all inline-block text-center"
              >
                List Your Property
              </Link>
              <Link
                href="/agents"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-extrabold text-lg hover:bg-white/20 transition-all inline-block text-center"
              >
                Partner With Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
