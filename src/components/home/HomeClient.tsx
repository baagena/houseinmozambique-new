'use client';

import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import FeaturedSlot, { type FeaturedSlotProps } from '@/components/home/FeaturedSlot';
import PropertyCard from '@/components/properties/PropertyCard';
import HomeHero from '@/components/home/HomeHero';
import AdBanner from '@/components/ads/AdBanner';
import { useLanguage } from '@/components/i18n/LanguageContext';
import Icon from '@/components/ui/Icon';

interface Ad {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  position: string;
  type: string;
  bgColor?: string | null;
  textColor?: string | null;
  accentColor?: string | null;
}

export interface CategoryCount {
  /** English fallback; the chip shows t.home[key] in the visitor's language. */
  label: string;
  key?: string;
  count: number;
  href: string;
}

export interface CityCount {
  name: string;
  count: number;
  image: string;
  href: string;
}

export interface PropertyTypeCard {
  title: string;
  description: string;
  href: string;
  image: string;
  count: number;
}

interface HomeClientProps {
  /** The one property in the featured slot, with the reason it is there. */
  slot?: FeaturedSlotProps | null;
  featuredAgents: any[];
  latest: any[];
  cities: CityCount[];
  categories: CategoryCount[];
  propertyTypes: PropertyTypeCard[];
  rentProps: any[];
  buyProps: any[];
  shortStayProps: any[];
  ads: Ad[];
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function HomeClient({
  slot,
  featuredAgents,
  latest,
  cities,
  categories,
  propertyTypes,
  rentProps,
  buyProps,
  shortStayProps,
  ads,
}: HomeClientProps) {
  const { t } = useLanguage();

  const quickLists = [
    { title: t.nav.forRent, items: rentProps, href: '/properties?type=Rent' },
    { title: t.nav.forSale, items: buyProps, href: '/properties?type=Buy' },
    { title: t.nav.shortStays, items: shortStayProps, href: '/properties?type=Short+Stay' },
  ];

  return (
    <>
      <HomeHero />

      {/* ── Category chips with live counts ── */}
      <section className="section--tight property-type-section">
        <div className="wrap">
          <div className="property-type-layout">
            <div className="property-type-intro">
              <span className="eyebrow">{t.home.exploreEyebrow}</span>
              <h2>{t.home.browsePropertyTypes}</h2>
              <p>{t.home.browsePropertyTypesDesc}</p>
              <Link href="/properties" className="property-type-all">{t.home.viewAllProperties} <span aria-hidden="true">→</span></Link>
            </div>
            <div className="property-type-grid">
              {propertyTypes.map((type, index) => (
                <Link key={type.title} href={type.href} className="property-type-card">
                  <span className="property-type-image">
                    <SafeImage src={type.image} alt={`${type.title} in Mozambique`} fill className="object-cover" sizes="(max-width: 680px) 72vw, (max-width: 1000px) 38vw, 18vw" />
                    <span className="property-type-count">{type.count} {type.count === 1 ? t.home.listingCountSingle : t.home.listingCount}</span>
                  </span>
                  <span className="property-type-copy">
                    <strong>{[t.home.typeHouses, t.home.typeApartments, t.home.typeOffices, t.home.typeLand, t.home.typeRentals][index]}</strong>
                    <span>{[t.home.typeHousesDesc, t.home.typeApartmentsDesc, t.home.typeOfficesDesc, t.home.typeLandDesc, t.home.typeRentalsDesc][index]}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div className="chips property-type-filters">
            {categories.map((cat) => (
              <Link key={cat.label} href={cat.href} className="chip">
                {(cat.key && (t.home as Record<string, string>)[cat.key]) || cat.label} <b>{cat.count}</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/*
        * ── The featured slot ──
        *
        * Removed from the page entirely when nothing clears the eligibility
        * bar, rather than rendered as an empty frame. featured-slot/README.md
        * is explicit: a slot that breaks, empties or silently shows last
        * month's pick is worse than not having one.
        */}
      {slot && (
        <section className="section pt0">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{t.home.featuredEyebrow}</span>
              <h2>{t.home.featuredTitle}</h2>
            </div>
            <FeaturedSlot {...slot} />
          </div>
        </section>
      )}

      {/* AD: billboard below the featured estate */}
      <section className="section pt0">
        <div className="wrap">
          <AdBanner ads={ads} position="after_featured" />
        </div>
      </section>

      {/* ── Latest listings ── */}
      {latest.length > 0 && (
        <section className="section pt0">
          <div className="wrap">
            <div className="section-title-row">
              <h2>{t.home.latestListings}</h2>
              <Link href="/properties">{t.home.seeAll} →</Link>
            </div>
            <div className="grid-cards">
              {latest.map((p) => (
                <PropertyCard key={p.id} property={p} sponsored={Boolean(p.isFeatured)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured agents ── */}
      {featuredAgents.length > 0 && (
        <section className="section pt0">
          <div className="wrap">
            <div className="section-title-row">
              <h2>Featured agents &amp; agencies</h2>
              <div className="flex items-center gap-4">
                <Link href="/services/agent-listing">Promote your agency →</Link>
                <Link href="/agents">{t.home.seeAll} →</Link>
              </div>
            </div>
            <div className="advs">
              {featuredAgents.slice(0, 6).map((agent) => (
                <Link key={agent.id} href={`/agents#${agent.id}`} className="adv">
                  <span className="adv__logo">
                    {agent.avatar ? (
                      <SafeImage src={agent.avatar} alt="" fill className="object-cover" sizes="62px" />
                    ) : (
                      agent.initials || initials(agent.name)
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="name">
                      <span className="truncate">{agent.name}</span>
                      {agent.isVerified && (
                        <Icon name="verified" size={16} className="vtick" />
                      )}
                    </span>
                    <span className="role block">{agent.title}</span>
                    <span className="meta">
                      <Icon name="location_on" size={15} />
                      <span className="truncate">{agent.location}</span>
                    </span>
                    {agent.yearsExperience ? (
                      <span className="meta">
                        <Icon name="workspace_premium" size={15} />
                        <span>{agent.yearsExperience} yrs</span>
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Post-a-property banner ── */}
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
            <Link href="/post-listing" className="btn btn--gold">
              {t.home.listPropertyBtn} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Explore by city ── */}
      {cities.length > 0 && (
        <section className="section pt0">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{t.home.exploreEyebrow}</span>
              <h2>{t.home.exploreTitle}</h2>
            </div>
            <div className="cities">
              {cities.map((city) => (
                <Link key={city.name} href={city.href} className={`city${city.count === 0 ? ' city--empty' : ''}`}>
                  <SafeImage
                    src={city.image}
                    alt={city.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 680px) 50vw, (max-width: 1000px) 33vw, (max-width: 1320px) 25vw, 16vw"
                  />
                  <span className="city__label">
                    <b>{city.name}</b>
                    <span>
                      {city.count} {t.home.propertiesCount}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AD: strip */}
      <section className="section pt0">
        <div className="wrap">
          <AdBanner ads={ads} position="sidebar_strip" />
        </div>
      </section>

      {/* ── Quick lists by listing type ── */}
      <section className="section pt0">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.home.browseEyebrow}</span>
            <h2>{t.home.quickListsTitle}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {quickLists.map((list) => (
              <div key={list.title}>
                <div className="section-title-row" style={{ marginBottom: 14 }}>
                  <h3 className="ui">{list.title}</h3>
                  <Link href={list.href}>{t.home.seeAll} →</Link>
                </div>
                {list.items.length ? (
                  <div className="max-h-[460px] space-y-1 overflow-y-auto pr-1">
                    {list.items.map((p) => (
                      <PropertyCard key={p.id} property={p} variant="compact" />
                    ))}
                  </div>
                ) : (
                  <div className="quick-empty">
                    <Icon name="home_work" />
                    <strong>{t.home.quickEmptyTitle}</strong>
                    <span>{t.home.quickEmptyBody}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Become an advertiser ── */}
      <section className="section pt0">
        <div className="wrap">
          <div className="band">
            <div>
              <span className="eyebrow" style={{ color: '#e9c877' }}>
                {t.home.bandEyebrow}
              </span>
              <h2>{t.home.agentCtaTitle}</h2>
              <p>{t.home.agentCtaDesc}</p>
            </div>
            <div className="band__cta">
              <Link href="/post-listing" className="btn btn--gold">
                {t.home.listPropertyBtn}
              </Link>
              <Link href="/agents" className="btn btn--light">
                {t.home.partnerWithUsBtn}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AD: before footer */}
      <section className="section pt0">
        <div className="wrap">
          <AdBanner ads={ads} position="before_footer" />
        </div>
      </section>

      {/* ── Partners marquee ── */}
    </>
  );
}
