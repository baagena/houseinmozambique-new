'use client';

/**
 * The home page's featured slot, rebuilt to featured-slot/README.md.
 *
 * The old one showed one WhatsApp broadcast three times over — as the title,
 * again in capitals as the description, and a third time in the title's own
 * duplicated flag prefix, with `*bold*` and `_italic_` rendered as literal
 * asterisks. Nine faults were annotated; four of them were code.
 *
 *   1 · Unprocessed agent paste. Every word here is now either generated from
 *       the listing fields or written by a named reviewer.
 *   2 · A lowercase transform applied to text containing proper nouns, which
 *       turned "Avenida Gerald Cândido Mondlane" into lower case. Fixed at
 *       source in lib/utils.ts, because it was never confined to this block.
 *   3 · "BUY · N1" — an internal enum on the front end. Replaced by the real
 *       taxonomy: intent, type, bairro, city.
 *   4 · No location field, on the most prominent property on the site.
 *
 * A block this size has to earn its space, and the way it earns it is by
 * saying WHY this property. That sentence comes from a person with a name
 * against it — and it is the one field on this page that must never be
 * machine-written.
 */

import { useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import Icon from '@/components/ui/Icon';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { formatPrice, formatListingTitle } from '@/lib/utils';
import { listingHeadline, isGeneratedHeadline, PT_TYPE } from '@/lib/listing-copy';
import { cardHeadline, listingSpecs, type SpecWords } from '@/lib/listing-specs';
import { standfirst, pricePerSqm } from '@/lib/listing-text';
import { hostIdentity } from '@/lib/host-identity';

export interface FeaturedProperty {
  id: string;
  slug?: string | null;
  title: string;
  titlePt?: string | null;
  description: string;
  images: string[];
  price: number;
  priceUnit: string;
  type: string;
  listingType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  neighborhood?: string | null;
  city?: string | null;
  location?: string | null;
  details?: Record<string, unknown> | null;
  host?: { id?: string; name?: string; initials?: string; role?: string; isVerified?: boolean } | null;
}

export interface FeaturedSlotProps {
  property: FeaturedProperty;
  kind: 'EDITOR' | 'PAID' | 'AUTO';
  note: string | null;
  notePt: string | null;
  reviewerName: string | null;
}

export default function FeaturedSlot({
  property, kind, note, notePt, reviewerName,
}: FeaturedSlotProps) {
  const { t, lang } = useLanguage();
  const pt = lang === 'pt';
  const p = t.property as unknown as Record<string, string>;
  const h = t.home as unknown as Record<string, string>;

  const [shot, setShot] = useState(0);
  const images = property.images?.filter(Boolean) ?? [];
  const image = images[shot] || images[0];
  const href = `/properties/${property.slug ?? property.id}`;

  /* The same headline the property page shows, so a visitor arriving from
     search recognises where they have landed. Never the agent's paste. */
  const title = isGeneratedHeadline(property.title, property.titlePt)
    ? formatListingTitle(listingHeadline(property as never, lang))
    : cardHeadline(
        {
          type: property.type,
          listingType: property.listingType,
          bedrooms: property.bedrooms,
          neighborhood: property.neighborhood,
          city: property.city,
        },
        {
          type: (raw) => (pt ? PT_TYPE[raw] ?? raw : raw),
          forSale: p.headSale, forRent: p.headRent,
          shortStay: p.headStay, auction: p.headAuction,
          inPlace: p.headIn, bedroom: p.headBedroom, pt,
        },
      );

  /* One sentence, plain, and never the same sentence as the title. */
  const lede = standfirst(property.description ?? '', 190);

  /* The reviewer's own words, in the reader's language. Null for a paid
     placement and for the automatic fallback, because neither has a reviewer. */
  const shownNote = (pt ? notePt || note : note) ?? null;

  /* The real taxonomy, replacing "BUY · N1". */
  const intent =
    property.listingType === 'Buy' ? p.badgeSale
    : property.listingType === 'Rent' ? p.badgeRent
    : property.listingType === 'Short Stay' ? p.badgeStay
    : p.badgeAuction;
  const typeLabel = pt ? PT_TYPE[property.type] ?? property.type : property.type;
  const place = [property.neighborhood, property.city].filter(Boolean).join(', ')
    || property.location || '';
  const crumbs = [intent, typeLabel, ...place.split(', ').filter(Boolean)];

  const words: SpecWords = {
    bed: p.specBed, bath: p.specBath,
    floor: (n) => `${n}${pt ? 'º' : ''} ${p.specFloor}`,
    groundFloor: p.specGroundFloor, plot: p.specPlot,
    parking: p.specParking, sleeps: p.specSleeps,
    duat: {
      'in order': p.duatInOrder, 'in progress': p.duatInProgress,
      none: p.duatNone, unknown: p.duatUnknown,
    },
    use: {
      office: p.useOffice, retail: p.useRetail,
      warehouse: p.useWarehouse, restaurant: p.useRestaurant,
    },
  };
  const facts = listingSpecs(
    {
      type: property.type, listingType: property.listingType,
      bedrooms: property.bedrooms, bathrooms: property.bathrooms,
      area: property.area, details: property.details ?? null,
    },
    words,
  );

  /* How commercial land is actually compared here, and no competitor prints
     it. Null for a rental, where the figure would be read as the wrong one. */
  const perSqm = pricePerSqm(property.price, property.area, property.priceUnit);

  /* A staff-posted listing is the platform's own, so the byline reads
     House in Mozambique rather than an internal account name. */
  const seller = hostIdentity(property.host);

  /* "View estate" belongs to English country-house listings, not a commercial
     plot in Maputo. The call to action names what it opens. */
  const isLand = (property.type ?? '').toLowerCase().includes('land');
  const isCommercial = /commercial|office|shop|warehouse|retail/i.test(property.type ?? '');
  const cta = isLand ? h.ctaPlot : isCommercial ? h.ctaSpace : h.ctaHome;

  return (
    <article className={`fs fs--${kind.toLowerCase()}`}>
      <div className="fs__media">
        <Link href={href} aria-label={title} className="fs__hit" />
        <SafeImage
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 1000px) 100vw, 60vw"
          priority
        />

        {/* Both arrows sit INSIDE the photograph. The old right-hand one
            straddled the seam with the white panel and read as a rendering
            fault rather than a control. */}
        {images.length > 1 && (
          <>
            <button
              type="button" className="fs__arw fs__arw--l"
              onClick={() => setShot((i) => (i - 1 + images.length) % images.length)}
              aria-label={pt ? 'Foto anterior' : 'Previous photo'}
            >
              <Icon name="chevron_left" size={16} />
            </button>
            <button
              type="button" className="fs__arw fs__arw--r"
              onClick={() => setShot((i) => (i + 1) % images.length)}
              aria-label={pt ? 'Foto seguinte' : 'Next photo'}
            >
              <Icon name="chevron_right" size={16} />
            </button>
            <span className="fs__dots" aria-hidden="true">
              {images.slice(0, 8).map((src, i) => (
                <i key={src} className={i === shot ? 'on' : undefined} />
              ))}
            </span>
          </>
        )}
      </div>

      <div className="fs__body">
        {/* An editor's pick and a paid placement must never look alike. */}
        <p className={`fs__label fs__label--${kind.toLowerCase()}`}>
          {kind === 'EDITOR' ? h.pickEditor : kind === 'PAID' ? h.pickPaid : h.pickAuto}
        </p>

        <p className="fs__crumbs">
          {crumbs.map((c, i) => (
            <span key={`${c}-${i}`}>{c}</span>
          ))}
        </p>

        <h3 className="fs__title">
          <Link href={href}>{title}</Link>
        </h3>

        {/*
          * The reviewer's sentence REPLACES the generated standfirst; it never
          * sits under it. Both say "why look at this", the reviewer's says it
          * better, and stacking them made an editor's pick 150px taller than
          * the fallback — so the same block changed height depending on which
          * kind of feature happened to be live.
          */}
        {lede && !(kind === 'EDITOR' && shownNote) && <p className="fs__lede">{lede}</p>}

        <div className="fs__price">
          <strong>{formatPrice(property.price, property.priceUnit)}</strong>
          {property.priceUnit === 'monthly' && <small>{p.perMonth}</small>}
          {property.priceUnit === 'nightly' && <small>{p.perNight}</small>}
          {perSqm && (
            <span className="fs__persqm">
              {formatPrice(perSqm, 'sale')} / m²
            </span>
          )}
        </div>

        {facts.length > 0 && (
          <ul className="fs__facts">
            {facts.map((f) => <li key={f}>{f}</li>)}
          </ul>
        )}

        {/*
          * The reason. This is the product — its entire value is that a person
          * put their name on it, which is why nothing machine-written can ever
          * appear here and why a paid placement gets no note at all.
          */}
        {kind === 'EDITOR' && shownNote && (
          <blockquote className="fs__note">
            <p>{shownNote}</p>
            {reviewerName && <cite>{reviewerName}</cite>}
          </blockquote>
        )}

        <div className="fs__foot">
          {seller && (
            <span className="fs__agent">
              <span className="fs__av" aria-hidden="true">{seller.initials}</span>
              {seller.name}
              {seller.isVerified && (
                <span className="fs__tick"><Icon name="check" size={9} />{p.verified}</span>
              )}
            </span>
          )}
          <Link href={href} className="btn btn--dark fs__cta">
            {cta}
            <Icon name="arrow_forward" size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}
