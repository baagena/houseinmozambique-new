'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import PropertyCard from '@/components/properties/PropertyCard';
import AdBanner from '@/components/ads/AdBanner';
import { Property } from '@/types';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface Ad {
  id: string;
  title: string;
  position: string;
  [key: string]: any;
}

interface Props {
  initialProperties: Property[];
  initialType?: string;
  initialLocation?: string;
  ads?: Ad[];
}

const PROPERTY_TYPES = ['Villa', 'Apartment', 'Penthouse', 'Land', 'Lodge', 'Studio', 'Bungalow'];
const PAGE_SIZE = 12;
const PAGE_HERO =
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=1800&auto=format&fit=crop';

export default function PropertiesClient({
  initialProperties,
  initialType,
  initialLocation,
  ads = [],
}: Props) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dealType, setDealType] = useState<string>(initialType || '');
  const [location, setLocation] = useState<string>(initialLocation || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Keep the rail in sync with the URL — the header, hero search and chips all
  // navigate here with query params.
  useEffect(() => {
    setDealType(searchParams.get('type') || '');
    setLocation(searchParams.get('location') || '');
    setMaxPrice(searchParams.get('max') || '');
    setFeaturedOnly(searchParams.get('isFeatured') === 'true');
    const pt = searchParams.get('propertyType');
    setSelectedTypes(pt ? [pt] : []);
    setVisible(PAGE_SIZE);
  }, [searchParams]);

  // The sheet is a modal on mobile — stop the page behind it scrolling.
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sheetOpen]);

  const syncFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '') params.delete(key);
      else params.set(key, val);
    });
    const qs = params.toString();
    router.push(qs ? `/properties?${qs}` : '/properties', { scroll: false });
  };

  const clearFilters = () => {
    setDealType('');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedTypes([]);
    setBedrooms(null);
    setFeaturedOnly(false);
    router.push('/properties', { scroll: false });
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]
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
      const matchesMinPrice = minPrice ? p.price >= Number(minPrice) : true;
      const matchesMaxPrice = maxPrice ? p.price <= Number(maxPrice) : true;
      const matchesFeatured = featuredOnly ? Boolean(p.isFeatured) : true;

      return (
        matchesType &&
        matchesLocation &&
        matchesPropType &&
        matchesBeds &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesFeatured
      );
    });
  }, [initialProperties, dealType, location, selectedTypes, bedrooms, minPrice, maxPrice, featuredOnly]);

  const sorted = useMemo(() => {
    if (sortBy === 'priceDesc') return [...filtered].sort((a, b) => b.price - a.price);
    if (sortBy === 'priceAsc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sortBy === 'featured')
      return [...filtered].sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
    return filtered;
  }, [filtered, sortBy]);

  const shown = sorted.slice(0, visible);
  const heading = location || initialLocation
    ? `${t.propertiesList.estatesIn} ${location || initialLocation}`
    : t.propertiesList.propertyInventory;

  const filterFields = (
    <>
      <div className="frow">
        <h5>{t.propertiesList.refineSearch}</h5>
        <button className="clear" onClick={clearFilters}>
          {t.propertiesList.clearAll}
        </button>
      </div>

      <div className="fgroup">
        <label htmlFor="f-location">{t.propertiesList.discoveryZone}</label>
        <input
          id="f-location"
          type="text"
          placeholder={t.propertiesList.searchPlaceholder}
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            syncFilters({ location: e.target.value });
          }}
        />
      </div>

      <div className="fgroup">
        <span className="flabel">{t.propertiesList.transactionModel}</span>
        <div className="radios">
          {[
            { id: '', label: t.propertiesList.allCategories },
            { id: 'Buy', label: t.propertiesList.ownership },
            { id: 'Rent', label: t.propertiesList.longTermLease },
            { id: 'Short Stay', label: t.propertiesList.hospitality },
            { id: 'Auction', label: t.propertiesList.competitiveBidding },
          ].map((opt) => (
            <label key={opt.id || 'all'}>
              <input
                type="radio"
                name="deal_type"
                checked={dealType === opt.id}
                onChange={() => {
                  setDealType(opt.id);
                  syncFilters({ type: opt.id === '' ? null : opt.id });
                }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="fgroup">
        <span className="flabel">{t.propertiesList.budgetaryParameters}</span>
        <div className="price-inputs">
          <input
            type="number"
            inputMode="numeric"
            placeholder={t.propertiesList.min}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder={t.propertiesList.max}
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              syncFilters({ max: e.target.value });
            }}
          />
        </div>
      </div>

      <div className="fgroup">
        <span className="flabel">{t.propertiesList.accommodation}</span>
        <div className="bedrow">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={bedrooms === n ? 'is-active' : ''}
              onClick={() => setBedrooms(bedrooms === n ? null : n)}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      <div className="fgroup">
        <span className="flabel">{t.propertiesList.architecturalStyle}</span>
        <div className="checks">
          {PROPERTY_TYPES.map((type) => (
            <label key={type}>
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => toggleType(type)}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div className="fgroup">
        <p className="mono text-[0.72rem] text-[var(--hm-muted)]">
          {t.propertiesList.foundAssets} {sorted.length} {t.propertiesList.curatedAssets}
        </p>
      </div>

      <button
        className="btn btn--dark btn--full btn--sm filters-toggle mt-2"
        onClick={() => setSheetOpen(false)}
      >
        {t.propertiesList.applyFilters}
      </button>
    </>
  );

  return (
    <>
      {/* ── Page hero ── */}
      <section className="page-hero">
        <div className="page-hero__bg">
          <SafeImage
            src={PAGE_HERO}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="wrap">
          <span className="eyebrow">
            {location || initialLocation
              ? `${t.propertiesList.discovery} · ${location || initialLocation}`
              : t.propertiesList.mozambique}
          </span>
          <h1 className="display-l">{heading}</h1>
          <p>{t.home.heroSubtitle}</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          {/* ── Listing-type chips (the quick control on every width) ── */}
          <div className="chips mb-7">
            {[
              { id: '', label: t.nav.allProperties },
              { id: 'Buy', label: t.nav.forSale },
              { id: 'Rent', label: t.nav.forRent },
              { id: 'Short Stay', label: t.nav.shortStays },
              { id: 'Auction', label: t.nav.auctions },
            ].map((cat) => (
              <button
                key={cat.id || 'all'}
                className={`chip${dealType === cat.id ? ' is-active' : ''}`}
                onClick={() => {
                  setDealType(cat.id);
                  syncFilters({ type: cat.id === '' ? null : cat.id });
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="inv-head">
            <div>
              <h2>{t.propertiesList.discovery}</h2>
              <p className="count">
                {sorted.length} {t.propertiesList.premiumResults}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn btn--ghost btn--sm filters-toggle" onClick={() => setSheetOpen(true)}>
                <span className="material-symbols-outlined text-[1.1rem]">tune</span>
                {t.propertiesList.filtersBtn}
              </button>
              <div className="sort">
                <label htmlFor="sort" className="mono text-[0.7rem] uppercase tracking-[0.1em]">
                  {t.propertiesList.displayLogic}
                </label>
                <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="featured">{t.propertiesList.curatedSelection}</option>
                  <option value="newest">{t.propertiesList.newestArrivals}</option>
                  <option value="priceDesc">{t.propertiesList.priceHighToLow}</option>
                  <option value="priceAsc">{t.propertiesList.priceLowToHigh}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="inv-layout">
            {/* ── Filter rail (bottom sheet under 680px) ── */}
            <aside className={`filters${sheetOpen ? ' is-open' : ''}`}>{filterFields}</aside>

            <div>
              {shown.length > 0 ? (
                <div className="grid-cards">
                  {shown.map((p, i) => (
                    <PropertyCard key={p.id} property={p} sponsored={Boolean(p.isPremium) && i % 6 === 5} />
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <span className="ico">
                    <span className="material-symbols-outlined text-[2.2rem]">search_off</span>
                  </span>
                  <h3>{t.propertiesList.noProperties}</h3>
                  <p>{t.propertiesList.tryAdjusting}</p>
                  <button className="btn btn--ghost btn--sm" onClick={clearFilters}>
                    {t.propertiesList.clearAll}
                  </button>
                </div>
              )}

              {ads.length > 0 && (
                <div className="mt-8">
                  <AdBanner ads={ads as any} position="sidebar_strip" />
                </div>
              )}

              {shown.length < sorted.length && (
                <div className="inv-load">
                  <button className="btn btn--ghost" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    {t.propertiesList.loadMore}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Reverse-marketplace prompt ── */}
      <section className="section pt0">
        <div className="wrap">
          <div className="reqban">
            <div>
              <span className="eyebrow" style={{ color: '#e9c877' }}>
                {t.home.bandEyebrow}
              </span>
              <h2>{t.home.agentCtaTitle}</h2>
              <p>{t.home.agentCtaDesc}</p>
            </div>
            <Link href="/pricing" className="btn btn--gold">
              {t.home.listPropertyBtn} →
            </Link>
          </div>
        </div>
      </section>

      <div
        className={`sheet-backdrop${sheetOpen ? ' is-open' : ''}`}
        onClick={() => setSheetOpen(false)}
        aria-hidden="true"
      />
    </>
  );
}
