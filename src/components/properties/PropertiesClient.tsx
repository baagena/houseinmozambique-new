'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PropertyCard from '@/components/properties/PropertyCard';
import { Property } from '@/types';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface Props {
  initialProperties: Property[];
  initialType?: string;
  initialLocation?: string;
}

export default function PropertiesClient({ initialProperties, initialType, initialLocation }: Props) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dealType, setDealType] = useState<string>(initialType || '');
  const [location, setLocation] = useState<string>(initialLocation || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [bathrooms, setBathrooms] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState(t.propertiesList.curatedSelection);

  // Sync sorting option names if language changes
  useEffect(() => {
    setSortBy(t.propertiesList.curatedSelection);
  }, [t]);

  useEffect(() => {
    setDealType(searchParams.get('type') || '');
    setLocation(searchParams.get('location') || '');
  }, [searchParams]);

  // Unified Filter Sync to URL
  const syncFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '') params.delete(key);
      else params.set(key, val);
    });
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    setDealType('');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedTypes([]);
    setBedrooms(null);
    setBathrooms(null);
    router.push(window.location.pathname, { scroll: false });
  };

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const filtered = useMemo(() => {
    return initialProperties.filter((p) => {
      const matchesType = dealType ? p.listingType === dealType : true;
      const matchesLocation = location
        ? p.location.toLowerCase().includes(location.toLowerCase()) ||
          p.city.toLowerCase().includes(location.toLowerCase())
        : true;
      const matchesPropType = selectedTypes.length ? selectedTypes.includes(p.type) : true;
      const matchesBeds = bedrooms ? p.bedrooms >= bedrooms : true;
      const matchesBaths = bathrooms ? p.bathrooms >= bathrooms : true;
      const matchesMinPrice = minPrice ? p.price >= Number(minPrice) : true;
      const matchesMaxPrice = maxPrice ? p.price <= Number(maxPrice) : true;
      
      return matchesType && matchesLocation && matchesPropType && matchesBeds && matchesBaths && matchesMinPrice && matchesMaxPrice;
    });
  }, [initialProperties, dealType, location, selectedTypes, bedrooms, bathrooms, minPrice, maxPrice]);

  const sorted = useMemo(() => {
    if (sortBy === t.propertiesList.priceHighToLow) return [...filtered].sort((a, b) => b.price - a.price);
    if (sortBy === t.propertiesList.priceLowToHigh) return [...filtered].sort((a, b) => a.price - b.price);
    return filtered;
  }, [filtered, sortBy, t]);

  return (
    <div className="flex max-w-[1920px] mx-auto">
      {/* ── Sidebar Filters ── */}
      <aside className="hidden lg:block w-80 sticky top-20 h-[calc(100vh-80px)] bg-white border-r border-[#c4c6cf]/10 overflow-y-auto custom-scrollbar p-8 space-y-8">
        
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-[#002045] uppercase tracking-[0.2em]">{t.propertiesList.refineSearch}</h3>
          <button 
            onClick={clearFilters}
            className="text-[10px] font-bold text-[#845326] hover:underline uppercase tracking-widest"
          >
            {t.propertiesList.clearAll}
          </button>
        </div>

        {/* Location Search */}
        <div>
          <h3 className="text-[10px] font-black text-[#002045] uppercase tracking-widest mb-4 opacity-40">{t.propertiesList.discoveryZone}</h3>
          <div className="relative">
            <input
              type="text"
              placeholder={t.propertiesList.searchPlaceholder}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                syncFilters({ location: e.target.value });
              }}
              className="w-full bg-[#f2f4f6]/50 border-none rounded-xl px-4 py-3.5 text-sm font-bold text-[#002045] placeholder-[#c4c6cf] focus:ring-2 focus:ring-[#002045]/5 focus:outline-none"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#c4c6cf]">location_on</span>
          </div>
        </div>

        {/* Deal Type */}
        <div>
          <h3 className="text-[10px] font-black text-[#002045] uppercase tracking-widest mb-4 opacity-40">{t.propertiesList.transactionModel}</h3>
          <div className="flex flex-col gap-3">
            {[
              { id: '', label: t.propertiesList.allCategories },
              { id: 'Buy', label: t.propertiesList.ownership },
              { id: 'Rent', label: t.propertiesList.longTermLease },
              { id: 'Short Stay', label: t.propertiesList.hospitality },
              { id: 'Auction', label: t.propertiesList.competitiveBidding },
            ].map((t) => (
              <label key={t.id} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="deal_type"
                    checked={dealType === t.id}
                    onChange={() => {
                        setDealType(t.id);
                        syncFilters({ type: t.id === '' ? null : t.id });
                    }}
                    className="appearance-none w-5 h-5 border-2 border-[#c4c6cf] rounded-full checked:border-[#002045] transition-all cursor-pointer"
                  />
                  {dealType === t.id && <div className="absolute w-2.5 h-2.5 bg-[#002045] rounded-full" />}
                </div>
                <span className={`text-xs font-bold transition-colors ${dealType === t.id ? 'text-[#002045]' : 'text-[#43474e] group-hover:text-[#002045]'}`}>
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-[10px] font-black text-[#002045] uppercase tracking-widest mb-4 opacity-40">{t.propertiesList.budgetaryParameters}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c4c6cf] font-bold text-xs">$</span>
              <input
                type="number"
                placeholder={t.propertiesList.min}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-3 bg-[#f2f4f6]/50 border-none rounded-xl text-xs font-bold text-[#002045] focus:outline-none"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c4c6cf] font-bold text-xs">$</span>
              <input
                type="number"
                placeholder={t.propertiesList.max}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-3 bg-[#f2f4f6]/50 border-none rounded-xl text-xs font-bold text-[#002045] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Property Type */}
        <div>
          <h3 className="text-[10px] font-black text-[#002045] uppercase tracking-widest mb-4 opacity-40">{t.propertiesList.architecturalStyle}</h3>
          <div className="grid grid-cols-1 gap-3">
            {['Villa', 'Apartment', 'Penthouse', 'Land', 'Lodge'].map((t) => (
              <label key={t} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(t)}
                  onChange={() => toggleType(t)}
                  className="w-5 h-5 rounded-md border-2 border-[#c4c6cf] text-[#002045] focus:ring-[#002045] transition-all cursor-pointer"
                />
                <span className={`text-xs font-bold ${selectedTypes.includes(t) ? 'text-[#002045]' : 'text-[#43474e] group-hover:text-[#002045]'}`}>{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <h3 className="text-[10px] font-black text-[#002045] uppercase tracking-widest mb-4 opacity-40">{t.propertiesList.accommodation}</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setBedrooms(bedrooms === n ? null : n)}
                  className={`flex-1 h-10 rounded-xl text-[10px] font-black border transition-all ${
                    bedrooms === n
                      ? 'border-[#002045] bg-[#002045] text-white shadow-lg shadow-[#002045]/20'
                      : 'border-[#c4c6cf]/30 text-[#43474e] hover:bg-[#002045]/5'
                  }`}
                >
                  {n}+
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#c4c6cf]/10">
          <p className="text-[10px] text-[#74777f] font-medium leading-relaxed italic">
            {t.propertiesList.foundAssets} {sorted.length} {t.propertiesList.curatedAssets}
          </p>
        </div>
      </aside>

      {/* ── Results ── */}
      <div className="flex-1">
        <section className="px-6 lg:px-12 py-12 bg-[#f7f9fb]">
          <div className="max-w-[1440px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#845326] uppercase tracking-[0.2em] mb-3">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {location || initialLocation ? `${t.propertiesList.discovery} / ${location || initialLocation}` : t.propertiesList.mozambique}
                </div>
                <h1
                  className="text-4xl font-extrabold text-[#002045] tracking-tighter"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  {location || initialLocation ? `${t.propertiesList.estatesIn} ${location || initialLocation}` : t.propertiesList.propertyInventory}
                </h1>
                <p className="text-[#43474e] text-sm mt-2 font-medium opacity-60">
                  {t.propertiesList.explorationPhase} {sorted.length} {t.propertiesList.premiumResults}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black tracking-widest uppercase">
                <span className="text-[#74777f]">{t.propertiesList.displayLogic}</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-[#c4c6cf]/20 rounded-xl px-6 py-3 pr-10 focus:ring-4 focus:ring-[#002045]/5 text-[#002045] cursor-pointer font-black focus:outline-none transition-all shadow-sm"
                  >
                    {[t.propertiesList.curatedSelection, t.propertiesList.newestArrivals, t.propertiesList.priceHighToLow, t.propertiesList.priceLowToHigh].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[#002045] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Category strip — the only listing-type control below the `lg` breakpoint,
                where the filter sidebar is hidden */}
            <div className="lg:hidden -mx-6 mb-10 overflow-x-auto custom-scrollbar px-6">
              <div className="flex w-max gap-2">
                {[
                  { id: '', label: t.nav.allProperties },
                  { id: 'Buy', label: t.nav.forSale },
                  { id: 'Rent', label: t.nav.forRent },
                  { id: 'Short Stay', label: t.nav.shortStays },
                  { id: 'Auction', label: t.nav.auctions },
                ].map((cat) => (
                  <button
                    key={cat.id || 'all'}
                    onClick={() => {
                      setDealType(cat.id);
                      syncFilters({ type: cat.id === '' ? null : cat.id });
                    }}
                    className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-xs font-black tracking-wide transition-all ${
                      dealType === cat.id
                        ? 'border-[#002045] bg-[#002045] text-white shadow-lg shadow-[#002045]/20'
                        : 'border-[#c4c6cf]/40 bg-white text-[#43474e] hover:border-[#002045]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {sorted.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>

            {sorted.length === 0 && (
              <div className="text-center py-24">
                <span className="material-symbols-outlined text-6xl text-[#c4c6cf]">search_off</span>
                <h3 className="text-2xl font-bold text-[#002045] mt-4">{t.propertiesList.noProperties}</h3>
                <p className="text-[#43474e] mt-2">{t.propertiesList.tryAdjusting}</p>
              </div>
            )}

            {sorted.length > 0 && (
              <div className="mt-16 flex justify-center">
                <button className="px-12 py-4 border-2 border-[#002045] text-[#002045] font-extrabold rounded-full hover:bg-[#002045] hover:text-white transition-all duration-300 tracking-widest uppercase text-xs">
                  {t.propertiesList.loadMore}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
