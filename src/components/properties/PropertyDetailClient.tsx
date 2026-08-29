'use client';

import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { formatPrice, formatListingTitle } from '@/lib/utils';
import PropertyCard from '@/components/properties/PropertyCard';

interface PropertyDetailClientProps {
  property: PropertyDetail;
  similar: SimilarProperty[];
}

interface PropertyAgent {
  id: string;
  name: string;
  title: string;
  initials: string;
  avatar?: string | null;
  isVerified?: boolean;
  rating?: number;
  phone?: string | null;
}

interface SimilarProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  priceUnit: string;
  images: string[];
  isNew?: boolean;
  rating?: number | null;
}

interface PropertyDetail extends SimilarProperty {
  description: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  listingType: string;
  type?: string;
  city?: string;
  isSuperhost?: boolean;
  isRareFind?: boolean;
  isPremium?: boolean;
  host?: PropertyAgent | null;
}

function getCoordinates(description: string | null | undefined) {
  const match = description?.match(/Coordinates:\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return { lat, lng };
}

/** The coordinate line is metadata, not prose — keep it out of the description. */
function stripCoordinates(description: string) {
  return description.replace(/Coordinates:\s*-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?/i, '').trim();
}

/** A short, stable reference derived from the listing id — shown on the PDP only. */
function refCode(id: string) {
  return id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
}

export default function PropertyDetailClient({ property, similar }: PropertyDetailClientProps) {
  const { t } = useLanguage();
  const agent = property.host;
  const coords = getCoordinates(property.description);
  const mapSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01}%2C${coords.lat - 0.01}%2C${coords.lng + 0.01}%2C${coords.lat + 0.01}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`
    : null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const isShortStay = property.listingType === 'Short Stay';
  const isRent = property.listingType === 'Rent';
  const period = isShortStay ? t.property.perNight : isRent ? t.property.perMonth : '';

  const title = formatListingTitle(property.title);
  const images = property.images?.length ? property.images : [''];
  const galleryImages = images.slice(0, 5);
  const amenities = showAllAmenities ? property.amenities : property.amenities.slice(0, 8);

  const whatsappHref = agent?.phone
    ? `https://wa.me/${agent.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
        `Hi, I'm interested in "${property.title}" (Ref ${refCode(property.id)}) on House in Mozambique.`
      )}`
    : null;

  const handleInquiry = async (type: 'contact' | 'viewing') => {
    setIsSubmitting(true);
    try {
      const subject =
        type === 'viewing'
          ? `Viewing request for ${property.title}`
          : `Inquiry about ${property.title}`;

      const message =
        type === 'viewing'
          ? `I would like to book a viewing for "${property.title}". Please let me know your available dates and times.`
          : `I am interested in your property listing "${property.title}". Please send me more information and available viewing times.`;

      const name = prompt('Please enter your name:') || 'Guest';
      const email = prompt('Please enter your email address:') || 'guest@example.com';

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          propertyId: property.id,
          agentId: agent?.id,
        }),
      });

      if (res.ok) {
        alert('Your inquiry has been sent successfully!');
      } else {
        alert('Failed to send inquiry.');
      }
    } catch {
      alert('An error occurred while sending the inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pdp-page">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">{t.nav.home}</Link> / <Link href="/properties">{t.propertyDetails.backToProperties}</Link>{' '}
          / <span className="text-[var(--ink)]">{title}</span>
        </nav>

        {/* ── Gallery mosaic (horizontal swipe under 680px) ── */}
        <div className="gallery" data-count={galleryImages.length}>
          {galleryImages.map((src, i) => (
            <div key={i}>
              <SafeImage
                src={src}
                alt={`${title} — ${i + 1}`}
                fill
                priority={i === 0}
                className="object-cover"
                sizes={i === 0 ? '(max-width: 680px) 100vw, 50vw' : '25vw'}
              />
              {i === galleryImages.length - 1 && images.length > 5 && (
                <span className="gallery__more">
                  {t.propertyDetails.viewAllPhotos} · {images.length}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="pdp">
          {/* ── Main column ── */}
          <div>
            <h1 className="display-l">{title}</h1>
            <p className="pdp__loc">
              <span className="material-symbols-outlined text-[1.1rem]">location_on</span>
              {property.location}
              <span className="ref ml-2">
                {t.propertyDetails.refCode} {refCode(property.id)}
              </span>
            </p>

            {/* Land and commercial listings have no beds/baths — omit them rather
                than printing a zero. */}
            <div className="spec-strip">
              {property.bedrooms > 0 && (
                <div className="spec">
                  <div className="k">{t.property.beds}</div>
                  <div className="v">{property.bedrooms}</div>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="spec">
                  <div className="k">{t.property.baths}</div>
                  <div className="v">{property.bathrooms}</div>
                </div>
              )}
              {property.area > 0 && (
                <div className="spec">
                  <div className="k">{t.propertyDetails.areaLabel}</div>
                  <div className="v">
                    {property.area} {t.property.area}
                  </div>
                </div>
              )}
              {property.type && (
                <div className="spec">
                  <div className="k">{t.propertyDetails.propertyType}</div>
                  <div className="v">{property.type}</div>
                </div>
              )}
              <div className="spec">
                <div className="k">{t.propertyDetails.listingTypeLabel}</div>
                <div className="v">{property.listingType}</div>
              </div>
            </div>

            <hr />

            <h2 className="block-h">{t.propertyDetails.aboutHome}</h2>
            <div className="about whitespace-pre-line text-[var(--hm-text)] leading-relaxed">
              {stripCoordinates(property.description)}
            </div>

            {property.amenities.length > 0 && (
              <>
                <hr />
                <h2 className="block-h">{t.propertyDetails.whatThisPlaceOffers}</h2>
                <ul className="highlights">
                  {amenities.map((a) => (
                    <li key={a}>
                      <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                      {a}
                    </li>
                  ))}
                </ul>
                {property.amenities.length > 8 && !showAllAmenities && (
                  <button className="btn btn--ghost btn--sm mt-5" onClick={() => setShowAllAmenities(true)}>
                    {t.propertyDetails.showAllAmenities} {property.amenities.length}{' '}
                    {t.propertyDetails.amenitiesText}
                  </button>
                )}
              </>
            )}

            {agent && (
              <>
                <hr />
                <h2 className="block-h">{t.propertyDetails.listedBy}</h2>
                <div className="agent-inline">
                  <span className="avi">
                    {agent.avatar ? (
                      <SafeImage src={agent.avatar} alt="" fill className="object-cover" sizes="58px" />
                    ) : (
                      agent.initials
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="name">
                      <span className="truncate">{agent.name}</span>
                      {agent.isVerified && (
                        <span className="material-symbols-outlined vtick text-[1rem]">verified</span>
                      )}
                    </div>
                    <div className="role">{agent.title}</div>
                    {agent.rating ? (
                      <div className="meta2 mono">★ {agent.rating}</div>
                    ) : null}
                  </div>
                  <div className="acts">
                    {agent.phone && (
                      <a href={`tel:${agent.phone}`} aria-label={t.propertyDetails.callAgent}>
                        <span className="material-symbols-outlined text-[1.05rem]">call</span>
                      </a>
                    )}
                    {whatsappHref && (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t.propertyDetails.whatsapp}
                      >
                        <span className="material-symbols-outlined text-[1.05rem]">chat</span>
                      </a>
                    )}
                    <a href={`/agents#${agent.id}`} aria-label={t.propertyDetails.listedBy}>
                      <span className="material-symbols-outlined text-[1.05rem]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </>
            )}

            <hr />

            {/* ── Location. Exact map when the agent supplied coordinates,
                   otherwise the styled approximate-area block. ── */}
            <h2 className="block-h">{t.propertyDetails.whereYoullBe}</h2>
            {mapSrc ? (
              <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)]">
                <iframe
                  title={`Map location for ${property.title}`}
                  src={mapSrc}
                  className="h-[320px] w-full border-0"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="map-approx">
                <span className="map-approx__ring" />
                <span className="map-approx__pin">
                  <span className="material-symbols-outlined text-[1.45rem]">location_on</span>
                </span>
                <span className="map-approx__tag">
                  {t.propertyDetails.approxArea} · {property.city || property.location}
                </span>
              </div>
            )}
            <p className="muted mt-4 max-w-[60ch] text-[0.9rem]">
              {mapSrc ? t.propertyDetails.locationDesc : t.propertyDetails.approxNote}
            </p>

            <hr />

            {/* ── Good to know. Short stays get stay-style info; long-term
                   listings get lease terms instead. ── */}
            <h2 className="block-h">{t.propertyDetails.goodToKnow}</h2>
            <div className="good-to-know">
              <div>
                <h5>{isShortStay ? t.propertyDetails.houseRules : t.propertyDetails.leaseTerms}</h5>
                <ul>
                  {isShortStay ? (
                    <>
                      <li>
                        <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                        {t.propertyDetails.noSmoking}
                      </li>
                      <li>
                        <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                        {t.propertyDetails.noPets}
                      </li>
                      {property.bedrooms > 0 && (
                        <li>
                          <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                          {t.propertyDetails.upToGuests} {property.bedrooms * 2}{' '}
                          {t.propertyDetails.guestsText}
                        </li>
                      )}
                    </>
                  ) : (
                    <>
                      <li>
                        <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                        {isRent ? t.propertyDetails.minLease : t.propertyDetails.purchase}
                      </li>
                      {isRent && (
                        <>
                          <li>
                            <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                            {t.propertyDetails.depositTerms}
                          </li>
                          <li>
                            <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                            {t.propertyDetails.utilitiesTerms}
                          </li>
                        </>
                      )}
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h5>{t.propertyDetails.security}</h5>
                <ul>
                  <li>
                    <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                    {t.propertyDetails.securityGuard}
                  </li>
                  <li>
                    <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                    {t.propertyDetails.smokeAlarm}
                  </li>
                  <li>
                    <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                    {t.propertyDetails.generator}
                  </li>
                </ul>
              </div>
              <div>
                <h5>{t.propertyDetails.nearby}</h5>
                <ul>
                  <li>
                    <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                    {property.city || property.location}
                  </li>
                  <li>
                    <span className="material-symbols-outlined ico text-[1.05rem]">check</span>
                    {t.propertyDetails.locationDesc.slice(0, 60)}…
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Sticky enquiry card ── */}
          <aside>
            <div className="enquiry">
              <div className="enquiry__price">
                {formatPrice(property.price, property.priceUnit)}
                {period && <small> {period}</small>}
              </div>
              <div className="enquiry__meta">
                <span className="tag">{property.listingType}</span>
                {property.type && <span className="tag">{property.type}</span>}
                <span className="ref">
                  {t.propertyDetails.refCode} {refCode(property.id)}
                </span>
              </div>

              <button
                onClick={() => handleInquiry('contact')}
                disabled={isSubmitting}
                className="btn btn--gold btn--full"
              >
                {t.propertyDetails.contactAgent}
              </button>

              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn--wa btn--full">
                  <span className="material-symbols-outlined text-[1.1rem]">chat</span>
                  {t.propertyDetails.whatsapp}
                </a>
              )}

              <button
                onClick={() => handleInquiry('viewing')}
                disabled={isSubmitting}
                className="btn btn--ghost btn--full"
              >
                {t.propertyDetails.bookViewing}
              </button>

              <p className="enquiry__note">{t.propertyDetails.inquiriesFree}</p>
            </div>
          </aside>
        </div>

        {/* ── Similar listings ── */}
        {similar.length > 0 && (
          <section className="section">
            <div className="section-title-row">
              <h2>{t.propertyDetails.similarHomes2}</h2>
              <Link href="/properties">{t.home.seeAll} →</Link>
            </div>
            <div className="grid-cards">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p as any} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Sticky mobile price bar ── */}
      <div className="mobile-bar">
        <div className="mp">
          {formatPrice(property.price, property.priceUnit)}
          {period && <small>{period}</small>}
        </div>
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn--wa btn--sm">
            <span className="material-symbols-outlined text-[1.1rem]">chat</span>
          </a>
        )}
        <button onClick={() => handleInquiry('contact')} disabled={isSubmitting} className="btn btn--gold">
          {t.propertyDetails.enquire}
        </button>
      </div>
    </div>
  );
}
