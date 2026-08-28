'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/components/i18n/LanguageContext';

const HERO_IMG = '/hero-marina.jpg';

const TABS = [
  { value: 'Buy', key: 'buy' },
  { value: 'Rent', key: 'rent' },
  { value: 'Short Stay', key: 'shortStay' },
  { value: 'Auction', key: 'auction' },
] as const;

const PROPERTY_TYPES = ['Villa', 'Apartment', 'Penthouse', 'Land', 'Lodge', 'Studio', 'Bungalow'];

/** Round MZN bands — kept in Meticais so the copy never mixes currencies. */
const PRICE_CAPS = [500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000];

export default function HomeHero() {
  const { t } = useLanguage();
  const router = useRouter();

  const [tab, setTab] = useState<string>('Buy');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tab) params.set('type', tab);
    if (location.trim()) params.set('location', location.trim());
    if (propertyType) params.set('propertyType', propertyType);
    if (maxPrice) params.set('max', maxPrice);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <section className="hero">
      <div className="hero__bg">
        <Image
          src={HERO_IMG}
          alt="Waterfront at dusk on the Mozambican coast"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div className="hero__inner">
        <div className="wrap">
          <span className="eyebrow">{t.home.heroBadge}</span>
          <h1 className="display-xl">{t.home.heroTitle}</h1>
          <p>{t.home.heroSubtitle}</p>

          <form className="search" role="search" onSubmit={submit}>
            <div className="search__tabs">
              {TABS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={tab === opt.value ? 'is-active' : ''}
                  onClick={() => setTab(opt.value)}
                  aria-pressed={tab === opt.value}
                >
                  {t.nav[opt.key]}
                </button>
              ))}
            </div>

            <div className="search__field">
              <label htmlFor="hero-location">{t.home.locationLabel}</label>
              <input
                id="hero-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t.home.searchPlaceholder}
              />
            </div>

            <div className="search__field">
              <label htmlFor="hero-type">{t.home.propertyAssetLabel}</label>
              <select id="hero-type" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option value="">{t.home.allTypes}</option>
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>

            <div className="search__field">
              <label htmlFor="hero-price">{t.propertiesList.max}</label>
              <select id="hero-price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
                <option value="">{t.propertiesList.anyPrice}</option>
                {PRICE_CAPS.map((cap) => (
                  <option key={cap} value={cap}>
                    MT {cap.toLocaleString('en-US')}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn--gold search__go">
              {t.home.findProperty}
              <span className="material-symbols-outlined text-[1.1rem]">arrow_forward</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
