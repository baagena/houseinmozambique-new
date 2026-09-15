'use client';

import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { useState } from 'react';
import { Property } from '@/types';
import { formatPrice, formatListingTitle } from '@/lib/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';
import Icon from '@/components/ui/Icon';

interface PropertyCardProps {
  property: Property;
  variant?: 'standard' | 'compact';
  hideLocation?: boolean;
  /** Marks the card as a paid placement in a listings grid. */
  sponsored?: boolean;
}

/** One badge only — the listing type, or "Sponsored" for a paid slot. */
function typeLabel(listingType: Property['listingType'], t: any) {
  switch (listingType) {
    case 'Buy':
      return t.property.badgeSale;
    case 'Rent':
      return t.property.badgeRent;
    case 'Short Stay':
      return t.property.badgeStay;
    default:
      return t.property.badgeAuction;
  }
}

/** Rent reads "/ mo", short stay "/ night", everything else has no period. */
function pricePeriod(unit: Property['priceUnit'], t: any) {
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
  const { t } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [isShared, setIsShared] = useState(false);

  const images = property.images?.filter(Boolean) ?? [];
  const cover = images[imageIndex] || images[0];
  const title = formatListingTitle(property.title);
  const period = pricePeriod(property.priceUnit, t);

  async function shareProperty() {
    const url = `${window.location.origin}/properties/${property.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} on House in Mozambique`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setIsShared(true);
      window.setTimeout(() => setIsShared(false), 1800);
    } catch {
      // Sharing can be cancelled by the browser without requiring user feedback.
    }
  }

  const specs = [
    property.bedrooms > 0 ? `${property.bedrooms} ${t.property.beds}` : null,
    property.bathrooms > 0 ? `${property.bathrooms} ${t.property.baths}` : null,
    property.area > 0 ? `${property.area} ${t.property.area}` : null,
  ].filter(Boolean) as string[];

  if (variant === 'compact') {
    return (
      <Link href={`/properties/${property.id}`} className="rowcard group">
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
            <span className="mono mt-1 truncate text-[0.7rem] text-[var(--hm-muted)]">
              {property.location}
            </span>
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
    <article className="card">
      <div className="card__media">
        <Link href={`/properties/${property.id}`} aria-label={title} className="absolute inset-0 z-[3]" />
        <SafeImage
          src={cover}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 33vw"
        />

        <span className={`badge${sponsored ? ' badge--ad' : ''}`}>
          {sponsored ? 'Sponsored' : typeLabel(property.listingType, t)}
        </span>

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="card__arrow card__arrow--prev"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageIndex((current) => (current - 1 + images.length) % images.length);
              }}
              aria-label="Show previous property image"
              title="Previous image"
            >
              <Icon name="chevron_left" />
            </button>
            <button
              type="button"
              className="card__arrow card__arrow--next"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageIndex((current) => (current + 1) % images.length);
              }}
              aria-label="Show next property image"
              title="Next image"
            >
              <Icon name="chevron_right" />
            </button>
            <span className="card__counter" aria-live="polite">{imageIndex + 1} / {images.length}</span>
          </>
        )}

        <button
          type="button"
          className={`card__share${isShared ? ' is-shared' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void shareProperty();
          }}
          aria-label={isShared ? 'Property link copied' : 'Share this property'}
          title={isShared ? 'Link copied' : 'Share property'}
        >
          <Icon name={isShared ? 'check' : 'share'} />
        </button>

        <button
          type="button"
          className={`heart${isSaved ? ' is-on' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSaved(!isSaved);
          }}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Remove from saved' : 'Save this property'}
        >
          <Icon name="favorite" size={18} style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }} />
        </button>
      </div>

      <div className="card__body">
        {/* Price first — the signature of the redesign. */}
        <p className="card__price">
          {formatPrice(property.price, property.priceUnit)}
          {period && <small> {period}</small>}
        </p>

        <Link href={`/properties/${property.id}`}>
          <h3 className="card__title ui line-clamp-2">{title}</h3>
        </Link>

        {!hideLocation && (
          <p className="card__loc">
            <Icon name="location_on" size={15} />
            <span className="truncate">{property.location}</span>
          </p>
        )}

        {/* Land and commercial listings have no beds/baths — don't print "0 Beds". */}
        <p className="card__specs">{specs.join(' · ')}</p>
      </div>
    </article>
  );
}
