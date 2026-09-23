'use client';

/**
 * The listing card, rebuilt to ui/listing-card.html.
 *
 * It is the most-seen object on the platform — a buyer meets forty of them
 * before they meet one property page — and the reference document lists six
 * faults in the old one, of which only two were visual:
 *
 *   1 · The title was the agent's, cut mid-word. It is now the GENERATED
 *       headline, which has a predictable length, so a two-line clamp never
 *       truncates like "Complexo de 6 Lojas Novas -…".
 *   2 · "6 Beds · 1 Baths" printed on a complex of six shops. The spec row is
 *       now chosen by property type — see lib/listing-specs.ts. This was the
 *       worst fault and it was a data-model bug wearing a UI costume.
 *   3 · The badge slot was spent saying "For rent" when the price already said
 *       "/ month". It now carries only what cannot be inferred: new this week,
 *       price reduced, or a labelled paid placement — and is absent otherwise,
 *       because a badge on every card has stopped being a signal.
 *   4 · Three permanent controls sat on the photograph. Share has gone to the
 *       property page where it belongs, the arrows fade in on hover and are
 *       hidden on touch, and what is left is one save button.
 *   5 · No trust signal. There is now an agent, their verification status and
 *       how long ago it was listed — in a market whose first question is
 *       whether the listing is real.
 *   6 · A whole row spent on "Listed 31 Aug 2026", which makes the reader do
 *       arithmetic. "3 weeks ago" is shorter, more useful, and sits beside the
 *       agent instead of taking a line of its own.
 */

import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { useState } from 'react';
import { Property } from '@/types';
import { formatPrice, formatListingTitle } from '@/lib/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { listingHeadline, isGeneratedHeadline, PT_TYPE } from '@/lib/listing-copy';
import {
  cardHeadline,
  listingSpecs,
  priceDrop,
  relativeAge,
  statusChip,
  type SpecWords,
} from '@/lib/listing-specs';
import Icon from '@/components/ui/Icon';
import { hostIdentity } from '@/lib/host-identity';

interface PropertyCardProps {
  property: Property;
  variant?: 'standard' | 'compact';
  hideLocation?: boolean;
  /** Marks the card as a paid placement. Labelled, never decorated. */
  sponsored?: boolean;
}

/** Rent reads "/ mo", short stay "/ night", everything else has no period. */
function pricePeriod(unit: Property['priceUnit'], t: { property: Record<string, string> }) {
  if (unit === 'monthly') return t.property.perMonth;
  if (unit === 'nightly') return t.property.perNight;
  return '';
}

export default function PropertyCard({
  property,
  variant = 'standard',
  hideLocation = false,
  sponsored = false,
}: PropertyCardProps) {
  const { t, lang } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const p = t.property as unknown as Record<string, string>;
  const images = property.images?.filter(Boolean) ?? [];
  const cover = images[imageIndex] || images[0];
  const href = `/properties/${property.slug ?? property.id}`;

  /*
   * The generated headline, never the agent's typed string.
   *
   * listingHeadline() returns a hand-written title as-is, which is right for
   * the property page — an agent who wrote their own H1 chose it. On a card it
   * is wrong: a grid is where "🇲🇿 OPORTUNIDADE COMERCIAL PREMIUM 🇲🇿
   * *VENDE-SE…" gets clamped mid-word. So the card composes its own from type
   * + bairro + city whenever the stored title was typed rather than generated.
   */
  const title = isGeneratedHeadline(property.title, property.titlePt)
    ? formatListingTitle(listingHeadline(property, lang))
    : cardHeadline(
        {
          type: property.type,
          listingType: property.listingType,
          bedrooms: property.bedrooms,
          neighborhood: property.neighborhood,
          city: property.city,
        },
        {
          type: (raw) => (lang === 'pt' ? PT_TYPE[raw] ?? raw : raw),
          forSale: p.headSale,
          forRent: p.headRent,
          shortStay: p.headStay,
          auction: p.headAuction,
          inPlace: p.headIn,
          bedroom: p.headBedroom,
          pt: lang === 'pt',
        },
      );
  const period = pricePeriod(property.priceUnit, t as { property: Record<string, string> });

  /** The words the spec row needs, so lib/listing-specs stays language-free. */
  const words: SpecWords = {
    bed: p.specBed,
    bath: p.specBath,
    floor: (n) => `${n}${lang === 'pt' ? 'º' : ordinal(n)} ${p.specFloor}`,
    groundFloor: p.specGroundFloor,
    plot: p.specPlot,
    parking: p.specParking,
    sleeps: p.specSleeps,
    duat: {
      'in order': p.duatInOrder,
      'in progress': p.duatInProgress,
      none: p.duatNone,
      unknown: p.duatUnknown,
    },
    use: {
      office: p.useOffice,
      retail: p.useRetail,
      warehouse: p.useWarehouse,
      restaurant: p.useRestaurant,
    },
  };

  const specs = listingSpecs(
    {
      type: property.type,
      listingType: property.listingType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      details: (property as { details?: Record<string, unknown> | null }).details ?? null,
    },
    words,
  );

  const publishedAt = property.approvedAt ?? property.createdAt ?? null;
  const drop = priceDrop(
    property.price,
    (property as { previousPrice?: number | null }).previousPrice,
    (property as { priceChangedAt?: string | Date | null }).priceChangedAt,
  );
  const chip = statusChip({
    promoted: sponsored,
    dropPercent: drop?.percent ?? null,
    publishedAt,
  });

  const place = [property.neighborhood, property.city].filter(Boolean).join(', ')
    || property.location;

  /*
   * The place goes in once.
   *
   * A composed headline already ends "… em Fomento, Maputo", so printing the
   * location line underneath spends a row of the card repeating the line above
   * it. A hand-written headline usually has no location in it and still gets
   * one. The property page makes the same check for the same reason.
   */
  const placeAlreadyInTitle =
    Boolean(place) && title.toLowerCase().includes(place.toLowerCase());

  const host = (property as {
    host?: { id?: string; name?: string; initials?: string; role?: string; isVerified?: boolean } | null;
  }).host;
  /* Staff-owned listings are bylined as the platform, not as an internal
     account name. Same rule as the property page, one helper. */
  const seller = hostIdentity(host);

  /* ── compact: the sidebar row, unchanged in purpose ────────────────────── */
  if (variant === 'compact') {
    return (
      <Link href={href} className="rowcard group">
        <span className="rowcard__media">
          <SafeImage
            src={cover}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="84px"
          />
        </span>
        <span className="flex min-w-0 flex-col justify-center">
          <span className="rowcard__title line-clamp-2">{title}</span>
          {!hideLocation && (
            <span className="mono mt-1 truncate text-[0.7rem] text-[var(--hm-muted)]">{place}</span>
          )}
          <span className="rowcard__price">
            {formatPrice(property.price, property.priceUnit)}
            {period && <small className="ml-1 text-[0.68rem] text-[var(--hm-muted)]">{period}</small>}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <article className="lc">
      <div className="lc__shot">
        <Link href={href} aria-label={title} className="lc__hit" />

        <SafeImage
          src={cover}
          alt={title}
          fill
          className="object-cover"
          /*
           * Around 1 GB of mobile data costs roughly 1.3% of GNI per capita
           * here, so a grid card asks for the smallest image that still looks
           * right rather than the full-size photograph.
           */
          sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 300px"
        />

        {/* One chip, only when there is something true to say. */}
        {chip && (
          <span className={`lc__chip lc__chip--${chip}`}>
            {chip === 'promoted' ? p.chipPromoted
              : chip === 'reduced' ? `${p.chipReduced} ${drop ? `${drop.percent}%` : ''}`.trim()
                : p.chipNew}
          </span>
        )}

        {/* The only permanent control on the photograph. */}
        <button
          type="button"
          className={`lc__save${isSaved ? ' is-on' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsSaved(!isSaved); }}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Remove from saved' : 'Save this property'}
        >
          <Icon name="favorite" size={16} />
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="lc__arw lc__arw--l"
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setImageIndex((i) => (i - 1 + images.length) % images.length);
              }}
              aria-label="Previous photo"
            >
              <Icon name="chevron_left" size={14} />
            </button>
            <button
              type="button"
              className="lc__arw lc__arw--r"
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setImageIndex((i) => (i + 1) % images.length);
              }}
              aria-label="Next photo"
            >
              <Icon name="chevron_right" size={14} />
            </button>
            <span className="lc__dots" aria-hidden="true">
              {images.slice(0, 6).map((src, i) => (
                <i key={src} className={i === imageIndex ? 'on' : undefined} />
              ))}
            </span>
          </>
        )}
      </div>

      <div className="lc__body">
        <p className="lc__prow">
          <span className="lc__price">{formatPrice(property.price, property.priceUnit)}</span>
          {period && <span className="lc__per">{period}</span>}
          {/* A reduction is the strongest buying signal a marketplace holds,
              and it reads as good news because for the buyer it is. */}
          {drop && (
            <span className="lc__delta">
              <Icon name="trending_down" size={10} />
              {drop.percent}%
            </span>
          )}
        </p>

        <Link href={href} className="lc__ttl">{title}</Link>

        {!hideLocation && place && !placeAlreadyInTitle && (
          <p className="lc__loc">
            <Icon name="location_on" size={12} />
            <span className="truncate">{place}</span>
          </p>
        )}

        {/* Type-aware. A retail complex does not have bedrooms. */}
        {specs.length > 0 && (
          <p className="lc__specs">
            {specs.map((sv) => <span key={sv}>{sv}</span>)}
          </p>
        )}
      </div>

      {/* Trust: who is selling it, whether we checked them, and how old it is. */}
      <div className="lc__foot">
        <span className="lc__av" aria-hidden="true">
          {seller?.initials ?? '—'}
        </span>
        <span className="lc__who">{seller?.name ?? ''}</span>
        {seller?.isVerified && (
          <span className="lc__tick" title={p.verified}>
            <Icon name="check" size={9} />
            {p.verified}
          </span>
        )}
        {publishedAt && <span className="lc__when">{relativeAge(publishedAt, lang)}</span>}
      </div>
    </article>
  );
}

/** "1st", "2nd", "3rd", "4th" — English only; Portuguese uses "º". */
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
