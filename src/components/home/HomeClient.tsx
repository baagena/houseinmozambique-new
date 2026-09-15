'use client';

import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import PropertyCard from '@/components/properties/PropertyCard';
import HomeHero from '@/components/home/HomeHero';
import AdBanner from '@/components/ads/AdBanner';
import { formatPrice, formatListingSentence } from '@/lib/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { useState } from 'react';
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
  label: string;
  count: number;
  href: string;
}

export interface CityCount {
  name: string;
  count: number;
  image: string;
  href: string;
}

interface HomeClientProps {
  featured: any[];
  featuredAgents: any[];
  latest: any[];
  cities: CityCount[];
  categories: CategoryCount[];
  rentProps: any[];
  buyProps: any[];
  shortStayProps: any[];
  ads: Ad[];
}

const PARTNERS = [
  'Millennium bim',
  'Standard Bank',
  'M-Pesa',
  'e-Mola',
  'FNB Moçambique',
  'Absa',
  'BCI',
  'Vodacom M-Pesa',
];

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function HomeClient({
  featured,
  featuredAgents,
  latest,
  cities,
  categories,
  rentProps,
  buyProps,
  shortStayProps,
  ads,
}: HomeClientProps) {
  const { t } = useLanguage();
  const hero = featured[0];
  const [showAllCities, setShowAllCities] = useState(false);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
  const [featuredShared, setFeaturedShared] = useState(false);

  const featuredImages = hero?.images?.filter(Boolean) ?? [];
  const featuredImage = featuredImages[featuredImageIndex] || featuredImages[0];

  async function shareFeatured() {
    if (!hero) return;
    const url = `${window.location.origin}/properties/${hero.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: formatListingSentence(hero.title), url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setFeaturedShared(true);
      window.setTimeout(() => setFeaturedShared(false), 1800);
    } catch {
      // Sharing can be cancelled by the browser without requiring user feedback.
    }
  }

  const quickLists = [
    { title: t.nav.forRent, items: rentProps, href: '/properties?type=Rent' },
    { title: t.nav.forSale, items: buyProps, href: '/properties?type=Buy' },
    { title: t.nav.shortStays, items: shortStayProps, href: '/properties?type=Short+Stay' },
  ];

  return (
    <>
      <HomeHero />

      {/* ── Category chips with live counts ── */}
      <section className="section pt0" style={{ paddingTop: 32 }}>
        <div className="wrap">
          <div className="chips">
            {categories.map((cat, i) => (
              <Link key={cat.label} href={cat.href} className={`chip${i === 0 ? ' is-active' : ''}`}>
                {cat.label} <b>{cat.count}</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured estate ── */}
      {hero && (
        <section className="section pt0">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{t.home.featuredEyebrow}</span>
              <h2>{t.home.featuredTitle}</h2>
            </div>
            <article className="feature">
              <div className="feature__media">
                <SafeImage
                  src={featuredImage}
                  alt={formatListingSentence(hero.title)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1000px) 100vw, 55vw"
                />
                {featuredImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="feature__arrow feature__arrow--prev"
                      onClick={() => setFeaturedImageIndex((current) => (current - 1 + featuredImages.length) % featuredImages.length)}
                      aria-label="Show previous featured property image"
                      title="Previous image"
                    >
                      <Icon name="chevron_left" />
                    </button>
                    <button
                      type="button"
                      className="feature__arrow feature__arrow--next"
                      onClick={() => setFeaturedImageIndex((current) => (current + 1) % featuredImages.length)}
                      aria-label="Show next featured property image"
                      title="Next image"
                    >
                      <Icon name="chevron_right" />
                    </button>
                    <span className="feature__counter">{featuredImageIndex + 1} / {featuredImages.length}</span>
                  </>
                )}
                <button
                  type="button"
                  className={`feature__share${featuredShared ? ' is-shared' : ''}`}
                  onClick={() => void shareFeatured()}
                  aria-label={featuredShared ? 'Featured property link copied' : 'Share featured property'}
                  title={featuredShared ? 'Link copied' : 'Share property'}
                >
                  <Icon name={featuredShared ? 'check' : 'share'} />
                </button>
              </div>
              <div className="feature__body">
                <span className="eyebrow">
                  {hero.listingType} · {hero.location}
                </span>
                <h2 className="feature__title">{formatListingSentence(hero.title)}</h2>
                <p className="feature__description">{hero.description}</p>
                <div className="feature__specs">
                  {[
                    hero.bedrooms > 0 ? `${hero.bedrooms} ${t.property.beds}` : null,
                    hero.bathrooms > 0 ? `${hero.bathrooms} ${t.property.baths}` : null,
                    hero.area > 0 ? `${hero.area} ${t.property.area}` : null,
                    hero.type,
                  ]
                    .filter(Boolean)
                    .map((spec, i, all) => (
                      <span key={spec as string}>
                        {spec}
                        {i < all.length - 1 ? ' ·' : ''}
                      </span>
                    ))}
                </div>
                <div className="feature__price">
                  {formatPrice(hero.price, hero.priceUnit)}
                  {hero.priceUnit === 'monthly' && <small className="ml-1 text-[0.8rem]">{t.property.perMonth}</small>}
                  {hero.priceUnit === 'nightly' && <small className="ml-1 text-[0.8rem]">{t.property.perNight}</small>}
                </div>
                <Link href={`/properties/${hero.id}`} className="btn btn--dark self-start">
                  {t.home.viewEstate}
                  <Icon name="arrow_forward" size={18} />
                </Link>
              </div>
            </article>
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
                <PropertyCard key={p.id} property={p} />
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
              <h2>{t.home.advertisersTitle}</h2>
              <Link href="/agents">{t.home.seeAll} →</Link>
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
            <Link href="/pricing" className="btn btn--gold">
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
              {(showAllCities ? cities : cities.slice(0, 6)).map((city) => (
                <Link key={city.name} href={city.href} className={`city${city.count === 0 ? ' city--empty' : ''}`}>
                  <SafeImage
                    src={city.image}
                    alt={city.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 33vw"
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
            {cities.length > 6 && (
              <button type="button" className="city-more" onClick={() => setShowAllCities((visible) => !visible)}>
                <span>{showAllCities ? 'Show fewer cities' : `View more cities (${cities.length - 6})`}</span>
                <Icon name={showAllCities ? 'expand_less' : 'expand_more'} />
              </button>
            )}
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
                    <strong>0 properties</strong>
                    <span>Nothing listed here yet.</span>
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
              <Link href="/pricing" className="btn btn--gold">
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
      <section className="partners">
        <div className="wrap">
          <span className="plabel">{t.home.partnersLabel}</span>
          <div className="marquee">
            <div className="marquee__track">
              {[...PARTNERS, ...PARTNERS].map((name, i) => (
                <span className="marquee__item" key={`${name}-${i}`}>
                  <i>{initials(name)}</i>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
