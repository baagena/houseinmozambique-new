'use client';

import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { formatPrice, formatListingSentence } from '@/lib/utils';
import PropertyCard from '@/components/properties/PropertyCard';
import Icon from '@/components/ui/Icon';
import ListingDescription from '@/components/properties/ListingDescription';
import ViewingRequest from '@/components/properties/ViewingRequest';
import PhotoLightbox from '@/components/properties/PhotoLightbox';
import { AMENITY_LABEL_PT, PT_TYPE, groupAmenities, listingHeadline } from '@/lib/listing-copy';
import { listingLifecycle } from '@/lib/listing-lifecycle';
import { stripListingMarkup } from '@/lib/listing-text';
import { hostIdentity } from '@/lib/host-identity';

/**
 * The property page, rebuilt to the structure in the design package's
 * ui/property-page.html.
 *
 * The decisions that file argues for, and which this keeps:
 *
 *   · Name, then ONE image, then the writing, then the photographs as a
 *     sequence. Not a 2fr/1fr/1fr grid with a sidebar stealing width from the
 *     gallery — on a property page the photographs are the product.
 *   · The price is set at BODY size, in the run of facts. A large coloured
 *     price is the portal tell.
 *   · Large type appears in exactly two places.
 *   · The H1 stays the formulaic keyword string, not an editorial name:
 *     Google rewrites 62-65% of title tags and reaches for the H1 first, a
 *     buyer arriving from search must see the words they searched, and ~69%
 *     of screen-reader users navigate by heading.
 *
 * Rendered in the existing site tokens rather than the package's own palette,
 * so it reads as the same site as everything around it.
 *
 * Two slots the design fills and this cannot yet: the display name ("A walled
 * villa on the Marginal") and the italic thesis line. Both come from
 * listing-writer.ts plus the bairro gazetteer, which is a separate build. They
 * are omitted rather than faked — an invented thesis line is worse than none.
 */

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
  reviewCount?: number;
  phone?: string | null;
  createdAt?: string | Date | null;
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
  titlePt?: string | null;

  /* When it went live and when it comes down — see lib/listing-lifecycle. */
  approvedAt?: string | Date | null;
  publishedUntil?: string | Date | null;
  subscription?: {
    status: string;
    currentPeriodEnd: string | Date;
    graceUntil: string | Date | null;
  } | null;

  latitude?: number | null;
  longitude?: number | null;
  description: string;
  descriptionEn?: string | null;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  listingType: string;
  type?: string;
  city?: string;
  neighborhood?: string | null;
  address?: string | null;
  isSuperhost?: boolean;
  isRareFind?: boolean;
  isPremium?: boolean;
  host?: PropertyAgent | null;
  views?: number;
  contactClicks?: number;
  viewingClicks?: number;
  contactWhatsapp?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  createdAt?: string | Date | null;
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


const fill = (tpl: string, v: Record<string, string | number>) =>
  Object.entries(v).reduce((o, [k, val]) => o.replace(`{${k}}`, String(val)), tpl);

const capitalise = (v: string) => (v ? v[0].toUpperCase() + v.slice(1) : v);

function daysAgo(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

/**
 * The listing's lifecycle, read outside the component body.
 *
 * `listingLifecycle` compares against the clock, and reading the clock while
 * rendering is exactly the kind of thing that makes a component produce a
 * different answer on the server and on the client. Module scope keeps it out
 * of the render path.
 */
function lifecycleOf(p: PropertyDetail) {
  return listingLifecycle({
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(0),
    approvedAt: p.approvedAt ? new Date(p.approvedAt) : null,
    publishedUntil: p.publishedUntil ? new Date(p.publishedUntil) : null,
    subscription: p.subscription
      ? {
          status: p.subscription.status,
          currentPeriodEnd: new Date(p.subscription.currentPeriodEnd),
          graceUntil: p.subscription.graceUntil ? new Date(p.subscription.graceUntil) : null,
        }
      : null,
  });
}

export default function PropertyDetailClient({ property, similar }: PropertyDetailClientProps) {
  const { t, lang } = useLanguage();

  /*
   * One language on the page, not two.
   *
   * `description` holds Portuguese and `descriptionEn` the English written
   * from the same answers. Before this the page showed the Portuguese body
   * under English section headings with English amenity chips beside it,
   * which reads as a half-finished translation rather than a bilingual site.
   *
   * Listings posted before descriptionEn existed have only the Portuguese, so
   * that is what an English reader gets — a real sentence in the wrong
   * language beats an empty section.
   */
  const body = lang === 'en' && property.descriptionEn?.trim()
    ? property.descriptionEn
    : property.description;

  /** Amenities are stored in English; the chips follow the page language. */
  const P = t.pdp;

  /*
   * Stored enums are English ("Apartment", "Rent"). They are data, not copy,
   * so they get translated at the edge rather than at write time — changing
   * what is stored would break every filter that matches on them.
   */
  const typeLabel = (v?: string) =>
    lang === 'pt' && v ? (PT_TYPE[v] ?? v) : (v ?? '\u2014');

  const amenityLabel = (a: string) =>
    lang === 'pt' ? (AMENITY_LABEL_PT[a] ? capitalise(AMENITY_LABEL_PT[a]) : a) : a;
  const agent = property.host;
  /* The byline. An ADMIN-owned listing is the platform's own, so it is posted
     by House in Mozambique rather than by a staff member's account name. */
  const seller = hostIdentity(agent as never);
  /*
   * The columns first, the old description line second.
   *
   * Listings published before `latitude`/`longitude` existed carry their point
   * as a "Coordinates: …" line inside the prose, so that path stays for them.
   * Anything created through the wizard now has real columns.
   */
  const coords = property.latitude != null && property.longitude != null
    ? { lat: property.latitude, lng: property.longitude }
    : getCoordinates(property.description);
  const mapSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01}%2C${coords.lat - 0.01}%2C${coords.lng + 0.01}%2C${coords.lat + 0.01}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`
    : null;

  const [shot, setShot] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareLabel, setShareLabel] = useState<string | null>(null);
  const enquiryRef = useRef<HTMLDivElement | null>(null);

  const isShortStay = property.listingType === 'Short Stay';
  const isRent = property.listingType === 'Rent';
  const period = isShortStay ? t.property.perNight : isRent ? t.property.perMonth : '';
  const dealLabel = isShortStay ? P.shortStay : isRent ? P.toRent : P.forSale;

  /*
   * The headline follows the page language, like the body above it.
   *
   * `title` is English and `titlePt` the Portuguese written from the same
   * answers. The site opens in Portuguese, so the common case was an English
   * H1 over a Portuguese description — the single most visible place the page
   * read as half-translated.
   *
   * Listings published before titlePt existed have none, so one is rebuilt
   * from the stored type, intent, rooms and place. If even that is not
   * possible the English title stands: a real headline in the wrong language
   * beats a stub in the right one.
   */
  const headline = listingHeadline(property, lang);

  const title = formatListingSentence(headline);

  /*
   * The breadcrumb's last crumb.
   *
   * It was printing the stored title in full — 190 characters of shouted
   * WhatsApp paste, asterisks and underscores intact, across the top of the
   * page. A breadcrumb says where you are, so it gets a short composed label:
   * markup stripped, and cut at a word boundary.
   */
  const crumbLabel = (() => {
    const clean = stripListingMarkup(title);
    if (clean.length <= 58) return clean;
    const cut = clean.slice(0, 58);
    const space = cut.lastIndexOf(' ');
    return `${(space > 30 ? cut.slice(0, space) : cut).replace(/[,;:\s-]+$/, '')}…`;
  })();
  const images = property.images?.length ? property.images : [];
  const listed = daysAgo(property.approvedAt ?? property.createdAt);

  /*
   * The lifecycle, shown in the spec table beside the reference.
   *
   * Copied from houseinrwanda.com, which prints a publication and an expiry
   * date on every listing. The pair answers the question a buyer actually has
   * — "is this still going?" — which no amount of photography does.
   */
  const life = lifecycleOf(property);

  const asDate = (d: Date | null) =>
    d ? d.toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  /*
   * The four side cells, taken in order from the one after the hero and
   * wrapping round. Ordering from `shot` rather than always from index 1
   * keeps the grid stable as you click through: the photograph you just
   * chose leaves the column and the next unseen one arrives.
   */
  /*
   * Two side photographs, not four.
   *
   * With the hero at 70% the remaining 30% was being split into two columns of
   * roughly 150px, so each thumbnail came out narrower than it was tall and
   * every landscape photograph — which is most of them — was cropped to a
   * portrait sliver. One column of two at ~300px is wider than it is tall, so
   * the crop is gentle and the frame matches the shape of the picture. The
   * rest of the set is one click away in the lightbox.
   */
  const others = Array.from({ length: Math.min(2, Math.max(0, images.length - 1)) }, (_, k) => {
    const i = (shot + 1 + k) % images.length;
    return { src: images[i], i };
  });

  const waNumber = (property.contactWhatsapp || agent?.phone || '').replace(/[^\d]/g, '');
  const callNumber = property.contactPhone || agent?.phone || null;
  /*
   * Email has no profile fallback. The agent's address is not in the public
   * DTO and putting it there would publish it on every listing they hold.
   */
  const emailAddress = property.contactEmail || null;

  const enquiryLine = `Hi, I'm interested in "${headline}" (Ref ${refCode(property.id)}) on House in Mozambique.`;
  const whatsappHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(enquiryLine)}`
    : null;
  const emailHref = emailAddress
    ? `mailto:${emailAddress}?subject=${encodeURIComponent(`Enquiry: ${headline}`)}&body=${encodeURIComponent(enquiryLine)}`
    : null;

  /*
   * Fire-and-forget, with keepalive: these presses navigate away to WhatsApp
   * or the dialer, and a normal fetch is cancelled when the page goes.
   */
  const track = useCallback((event: 'whatsapp' | 'call' | 'email') => {
    void fetch(`/api/property/${property.id}/engagement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => undefined);
  }, [property.id]);

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: headline, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareLabel(P.linkCopied);
        setTimeout(() => setShareLabel(null), 2000);
      }
    } catch { /* the user dismissed the sheet */ }
  };

  /* The specification list — only rows we actually hold a value for. */
  const isLandListing = /land|plot|terreno/i.test(property.type ?? '');

  const spec: Array<[string, string]> = [
    [P.sType, typeLabel(property.type)],
    [P.sListing, dealLabel],
    ...(property.bedrooms ? [[P.sBedrooms, String(property.bedrooms)] as [string, string]] : []),
    ...(property.bathrooms ? [[P.sBathrooms, String(property.bathrooms)] as [string, string]] : []),
    // A plot has no internal area. Labelling its 450 m² "Internal area" said
    // the property had 450 m² of building on it, which is the opposite.
    ...(property.area
      ? [[isLandListing ? (P.sPlotArea ?? P.sArea) : P.sArea, `${property.area} m²`] as [string, string]]
      : []),
    ...(property.neighborhood ? [[P.sBairro, property.neighborhood] as [string, string]] : []),
    ...(property.city ? [[P.sCity, property.city] as [string, string]] : []),
    [P.sReference, refCode(property.id)],
    ...(asDate(life.publishedAt) ? [[t.property.listedOn, asDate(life.publishedAt)!] as [string, string]] : []),
    /* Only shown when there is a real end date. A listing with no limit says
       nothing rather than "—", which reads as missing data. */
    ...(asDate(life.expiresAt) ? [[t.property.availableUntil, asDate(life.expiresAt)!] as [string, string]] : []),
  ];

  const hasDuat = property.amenities.some((a) => /duat/i.test(a));

  return (
    <div className="pdp2">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">{t.nav.home}</Link> / <Link href="/properties">{t.propertyDetails.backToProperties}</Link>{' '}
          / <span>{crumbLabel}</span>
        </nav>
      </div>

      {/* 1 · NAME ------------------------------------------------------- */}
      <div className="wrap namewrap">
        <div className="eyebrow2">
          {property.neighborhood && <><span>{property.neighborhood}</span><i className="dot" /></>}
          {property.city && <><span>{property.city}</span><i className="dot" /></>}
          <span>{dealLabel}</span>
        </div>
        {/*
          * Formulaic, keyword-bearing, no brand suffix — see the file header.
          *
          * The design sizes this for a generated H1 of about 48 characters
          * ("4 Bedroom House for Sale in Costa do Sol, Maputo"). Every listing
          * posted before the wizard has a hand-written title instead, some
          * over 100 characters of shouting caps, and at the display size those
          * fill the screen before a buyer sees a photograph. Step the size
          * down by length rather than truncating: the whole title is still the
          * H1, which is what search and a screen reader need.
          */}
        {/* `title`, not the raw headline: the H1 was printing the stored
            string verbatim, so a shouted WhatsApp paste with its asterisks and
            flag emoji intact became the page's heading — and the <title> tag
            with it. */}
        <h1 className="pname" data-len={title.length > 80 ? 'long' : title.length > 52 ? 'mid' : 'short'}>
          {title}
        </h1>
        {/* The price sits at body size, in the run of facts. Not shouted. */}
        <div className="specline">
          <i><b>{formatPrice(property.price, property.priceUnit)}{period && <> {period}</>}</b></i>
          {property.bedrooms > 0 && <i>{property.bedrooms} {t.property.beds ?? 'bedrooms'}</i>}
          {property.bathrooms > 0 && <i>{property.bathrooms} {t.property.baths ?? 'bathrooms'}</i>}
          {property.area > 0 && <i>{property.area} m²</i>}
        </div>
      </div>

      {/* 2 · THE PHOTOGRAPHS, FULL WIDTH -------------------------------- */}
      {images.length > 0 && (
        <section className="viewer">
          <div className="wrap">
            {/*
              * A hero beside a column of the rest, not one stage with a
              * filmstrip under it.
              *
              * The stage had to be a fixed rectangle, and listing photographs
              * are every aspect a phone produces — a portrait shot contained
              * in a 16:10 stage used about a third of the width and left the
              * rest as blur. The hero is a 4:3 box that most photographs fill
              * honestly, and the side column earns the width the blur wasted.
              *
              * Anything here opens the lightbox, which is where a photograph
              * gets the whole screen and is never cropped.
              */}
            {/*
              * The hero is the main place, and the side cells change what is
              * in it rather than being a separate gallery. Switching a
              * photograph you are already looking at into a modal is a step
              * nobody asked for — the enlarge is a deliberate second action,
              * on the hero itself.
              *
              * The side column shows the OTHER photographs, so the one you
              * are looking at is never also sitting in the grid beside it.
              */}
            <div className="mosaic" data-count={Math.min(images.length, 3)}>
              <button
                className="m-cell m-hero"
                onClick={() => setLightbox(true)}
                aria-label={P.enlarge}
              >
                <SafeImage
                  key={images[shot]}
                  src={images[shot]}
                  alt={`${title} — ${shot + 1}`}
                  fill
                  sizes="(max-width: 860px) 100vw, 70vw"
                  /*
                   * `contain`, not `cover`: the whole photograph, never a crop.
                   *
                   * `cover` fills the box by cutting whatever does not fit,
                   * which on a portrait shot removes the top and bottom of the
                   * room. A listing photograph is the thing being sold, so the
                   * box gives way to the image rather than the other way round
                   * — .m-hero mats the leftover space so the letterboxing
                   * reads as a frame rather than a gap.
                   *
                   * The side thumbnails keep `cover`: they are index prints,
                   * and at that size a crop costs nothing.
                   */
                  style={{ objectFit: 'contain' }}
                  priority
                />
                <span className="m-zoom" aria-hidden>
                  <Icon name="visibility" size={15} />
                  {P.enlarge}
                </span>
              </button>

              {others.map(({ src, i }) => (
                <button
                  key={src + i}
                  className="m-cell"
                  onClick={() => setShot(i)}
                  aria-label={fill(P.showPhoto, { n: i + 1 })}
                >
                  <SafeImage src={src} alt={`${title} — ${i + 1}`} fill sizes="(max-width: 860px) 50vw, 30vw" style={{ objectFit: 'cover' }} />
                </button>
              ))}

              <button className="m-all" onClick={() => setLightbox(true)}>
                <Icon name="grid_view" size={15} />
                {fill(P.allPhotos, { count: images.length })}
              </button>
            </div>
          </div>
        </section>
      )}

      {lightbox && (
        <PhotoLightbox
          images={images}
          index={shot}
          title={title}
          onIndex={setShot}
          onClose={() => setLightbox(false)}
          closeLabel={P.closePhotos}
          counterLabel={(i, n) => `${i} / ${n}`}
        />
      )}

      {/* 3 · ACTION STRIP ----------------------------------------------- */}
      <div className="wrap">
        <div className="actbar">
          <div className="who">
            <div className="pr">{formatPrice(property.price, property.priceUnit)}{period && <small> {period}</small>}</div>
            <div className="sub">
              {[property.neighborhood, property.city].filter(Boolean).join(', ')}
              {listed !== null && (
                <> · {listed === 0 ? P.listedToday : listed === 1 ? P.listedDay : fill(P.listedDays, { count: listed })}</>
              )}
              {' '}· {P.ref} {refCode(property.id)}
            </div>
          </div>

          <button className={`btn btn--ghost${saved ? ' is-on' : ''}`} onClick={() => setSaved((v) => !v)}>
            <Icon name="favorite" size={17} />
            {saved ? P.saved : P.save}
          </button>

          <button className="btn btn--ghost" onClick={share}>
            <Icon name="share" size={17} />
            {shareLabel ?? P.share}
          </button>

          <button
            className="btn btn--ghost"
            onClick={() => enquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            {t.propertyDetails.bookViewing}
          </button>

          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp')}
              className="btn btn--wa"
            >
              <Icon name="chat" size={17} />
              {t.propertyDetails.whatsapp}
            </a>
          )}
        </div>
      </div>

      {/* 4 · THE READING, AND THE PANEL BESIDE IT ----------------------- */}
      <div className="wrap">
        <div className="split">
          <main>
            <section className="writing">
              <div className="col">
                <h2 className="lbl2">
                  {isLandListing
                    ? (t.propertyDetails.aboutPlot ?? t.propertyDetails.aboutHome)
                    : t.propertyDetails.aboutHome}
                </h2>
                <ListingDescription text={stripCoordinates(body)} className="prose" />
              </div>
            </section>

            <section className="spec">
              <div className="col">
                <h2 className="lbl2">{P.specification}</h2>
                <dl>
                  {spec.map(([k, v]) => (
                    <div className="row" key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            {property.amenities.length > 0 && (
              <section className="spec">
                <div className="col">
                  <h2 className="lbl2">{t.propertyDetails.whatThisPlaceOffers}</h2>
                  {/*
                    * Grouped the way they were ticked — indoor, outdoor,
                    * security, annex, the plot, paperwork — rather than as one
                    * flat run of checkmarks. With a dozen amenities the flat
                    * list is unreadable, and the groups are the same ones the
                    * description no longer bullets.
                    */}
                  <div className="amgroups">
                    {groupAmenities(property.amenities).map((g) => (
                      <div className="amgroup" key={g.key}>
                        {g.label && <h3 className="amgroup-h">{lang === 'pt' ? g.labelPt : g.label}</h3>}
                        <ul className="highlights">
                          {g.items.map((a) => (
                            <li key={a}><Icon name="check" size={17} className="ico" />{amenityLabel(a)}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="loc">
              <div className="col">
                <h2 className="lbl2">
                  {P.location}{[property.neighborhood, property.city].filter(Boolean).length > 0 && ' — '}
                  {[property.neighborhood, property.city].filter(Boolean).join(', ')}
                </h2>
                <div className="mapcard">
                  {mapSrc ? (
                    <iframe src={mapSrc} title="Map" loading="lazy" style={{ width: '100%', height: 320, border: 0, display: 'block' }} />
                  ) : (
                    <div className="mapempty">
                      <Icon name="location_on" size={26} />
                      <span>{[property.neighborhood, property.city].filter(Boolean).join(', ') || P.locationOnEnquiry}</span>
                    </div>
                  )}
                  <div className="mapfoot">
                    <span>{P.approx}</span>
                    {coords && <span className="mono">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>}
                  </div>
                </div>
              </div>
            </section>

            <section className="block papers">
              <div className="col">
                <h2 className="lbl2">{P.paperwork}</h2>
                {hasDuat && (
                  <div className="p">
                    <span className="tick"><Icon name="check" size={11} /></span>
                    <span>
                      <b className="t">{P.duatOk}</b>
                      <span className="s">{P.duatBy}</span>
                    </span>
                  </div>
                )}
                <p className="papernote">{P.duatNote}</p>
              </div>
            </section>

            {agent && seller && (
              <section className="block">
                <div className="col">
                  <h2 className="lbl2">{P.whoSelling}</h2>
                  <div className="person">
                    <div className={seller.isHouse ? 'av av--house' : 'av'}>{seller.initials}</div>
                    <div style={{ flex: 1, minWidth: 210 }}>
                      <div className="nm">
                        {seller.name}
                        {seller.isVerified && (
                          <span className="tagv"><Icon name="verified" size={11} />Verified</span>
                        )}
                      </div>
                      {/* A staff account's job title ("Administrator") is not a
                          seller description. The house says what it is. */}
                      <div className="mt">{seller.isHouse ? P.houseTeam : agent.title}</div>
                      {!seller.isHouse && (agent.rating ?? 0) > 0 && (
                        <div className="st">
                          <div><b>{agent.rating}</b>{P.rating}</div>
                          {(agent.reviewCount ?? 0) > 0 && <div><b>{agent.reviewCount}</b>{P.reviews}</div>}
                        </div>
                      )}
                    </div>
                    {/* The house has no directory profile, so it gets no link
                        rather than one that lands nowhere. */}
                    {seller.profileHref && (
                      <Link href={seller.profileHref} className="btn btn--ghost btn--sm">
                        {t.propertyDetails.listedBy}
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            )}
          </main>

          <aside className="rail" ref={enquiryRef}>
            <div className="railcard">
              <div className="hd">
                <h3>{t.propertyDetails.contactAgent}</h3>
                <p>{t.propertyDetails.inquiriesFree}</p>
              </div>
              <div className="bd">
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp')} className="btn btn--wa btn--full">
                    <Icon name="chat" size={18} />{t.propertyDetails.whatsapp}
                  </a>
                )}
                {callNumber && (
                  <a href={`tel:${callNumber}`} onClick={() => track('call')} className="btn btn--ghost btn--full">
                    <Icon name="call" size={18} />{t.propertyDetails.callAgent}
                  </a>
                )}
                {emailHref && (
                  <a href={emailHref} onClick={() => track('email')} className="btn btn--ghost btn--full">
                    <Icon name="mail" size={18} />{t.propertyDetails.emailAgent}
                  </a>
                )}
              </div>
            </div>

            <div className="railcard">
              <div className="hd">
                <h3>{t.propertyDetails.bookViewing}</h3>
              </div>
              <div className="bd">
                <ViewingRequest
                  propertyId={property.id}
                  propertyTitle={headline}
                  agentId={agent?.id}
                  whatsappNumber={property.contactWhatsapp || agent?.phone || null}
                  labels={{
                    title: t.propertyDetails.bookViewing,
                    intro: t.viewing.intro,
                    pickTimes: t.viewing.pickTimes,
                    yourName: t.viewing.yourName,
                    yourPhone: t.viewing.yourPhone,
                    send: t.viewing.send,
                    sending: t.viewing.sending,
                    sentTitle: t.viewing.sentTitle,
                    sentBody: t.viewing.sentBody,
                    again: t.viewing.again,
                    needOne: t.viewing.needOne,
                    needName: t.viewing.needName,
                    needPhone: t.viewing.needPhone,
                  }}
                />
              </div>
            </div>
          </aside>
        </div>

        {/* 5 · RELATED --------------------------------------------------- */}
        {similar.length > 0 && (
          <section className="rel">
            <h2 className="lbl2">
              {property.listingType === 'Rent' ? P.similarRent : P.similarSale}
              {(property.neighborhood || property.city)
                ? ' ' + fill(P.inPlace, { place: property.neighborhood || property.city || '' })
                : ''}
            </h2>
            <div className="grid-cards">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p as never} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile bar — the price and the one action, on a phone. */}
      <div className="mobile-bar">
        <div className="mp">
          {formatPrice(property.price, property.priceUnit)}
          {period && <small>{period}</small>}
        </div>
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => track('whatsapp')} className="btn btn--wa btn--sm">
            <Icon name="chat" size={18} />
          </a>
        )}
        <button
          onClick={() => enquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="btn btn--gold"
        >
          {t.propertyDetails.enquire}
        </button>
      </div>
    </div>
  );
}
