'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { wizardCopy, type WizardCopy } from '@/components/dashboard/listing-wizard-copy';
import ListingDescription from '@/components/properties/ListingDescription';
import MapPicker from '@/components/listing/MapPicker';
import PublishGate, {
  type GateListing, type GatePlan, type GateState,
} from '@/components/listing/PublishGate';
import {
  CITY_CENTRE, DEFAULT_CENTRE, formatLatLng, isShortMapLink, looksOutsideMozambique,
  parseLatLng,
} from '@/lib/geo';
import { createProperty, uploadSingleImage } from '@/actions/properties';
import {
  CITIES, PROPERTY_TYPES, PT_TYPE,
  featureGroupsFor, featuresInScope, generateListing, publishBlockers, slugify,
  AREA_SANITY, CATEGORY_QUESTIONS, CHOICES, EMPTY_CATEGORY_ANSWERS,
  NUMERIC_FIELDS, isBuilt,
  type CategoryKey,
  type GeneratedListing, type ListingAnswers, type ListingIntent,
} from '@/lib/listing-copy';

/**
 * The guided listing screen from the design package's preview (#view-ag-new).
 *
 * Every string on the right-hand panel is composed by src/lib/listing-copy.ts
 * from the answers on the left — no model call, no API key, same answers in,
 * same page out. The preview labels that panel "built from your answers · not
 * AI" and this keeps that label honest.
 *
 * English only, matching ComposeListingClient and the rest of the console
 * screens. The copy it GENERATES is Portuguese, which is the half that reaches
 * buyers.
 */

/*
 * "Details" is new and sits third, right after the numbers.
 *
 * It is the step that differs by category: condition and furnishing for a
 * building, zoning / DUAT / road / structures for a plot. Placed before
 * Features so the agent answers what the property IS before ticking what it
 * has, and so the preview has something category-specific in it early.
 */
/** Seven steps; their labels live in listing-wizard-copy.ts. */
const LAST = 7;

/**
 * A property type's label in the form's language.
 *
 * The stored VALUE stays English — Property.type is English throughout and the
 * public page translates it at the edge — so only what the agent reads changes.
 * Passing the copy object in rather than the language keeps the dependency one
 * way: this file already has the copy, and PT_TYPE already exists for the
 * listing page.
 */
function PT_TYPE_OPTION(w: WizardCopy, type: string): string {
  return w.isPt ? PT_TYPE[type] ?? type : type;
}

/** Longest edge of an uploaded photo, matching /post-property. */
const MAX_IMAGE_EDGE = 1600;
const IMAGE_QUALITY = 0.82;

const EMPTY: ListingAnswers = {
  ...EMPTY_CATEGORY_ANSWERS,
  listingType: 'sale',
  propertyType: 'House',
  city: 'Maputo',
  bairro: '',
  beds: 0,
  baths: 0,
  parking: 0,
  buildingSize: 0,
  landSize: 0,
  price: 0,
  currency: 'MZN',
  features: [],
  near: ['', '', ''],
  lat: null,
  lng: null,
  photos: 0,
  interior: 0,
};

/**
 * Phone photos run to 5-16 MB and the raw base64 of one of those overflows the
 * server action body limit. Downscale and re-encode in the browser first —
 * the same pipeline /post-property uses, for the same reason.
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`"${file.name}" is not an image file.`));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('This browser could not process the image.'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
      } catch {
        reject(new Error(`"${file.name}" could not be processed. Try a different photo.`));
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`"${file.name}" could not be read as an image.`));
    };

    image.src = objectUrl;
  });
}

interface Shot {
  file: File;
  preview: string;
  interior: boolean;
}

/**
 * Contact details are held apart from ListingAnswers on purpose.
 *
 * generateListing() only ever sees ListingAnswers, so there is no path by which
 * a phone number can end up inside the description text. It reaches the listing
 * page as buttons instead, which is the only form that can be counted: a number
 * pasted into a paragraph cannot be attributed, and it goes stale in every copy
 * of that text the day the agent changes it.
 */
interface ContactDetails {
  whatsapp: string;
  phone: string;
  email: string;
}

const NO_CONTACT: ContactDetails = { whatsapp: '', phone: '', email: '' };

export default function NewListingWizard({
  needsVerification = false,
  email,
}: {
  /** True when this account cannot publish yet — createProperty would refuse. */
  needsVerification?: boolean;
  email?: string;
} = {}) {
  const router = useRouter();
  /* The agent's own language, not the preview's. The preview below has its own
     PT/EN toggle because checking how the English page reads is a separate
     job from reading the form. */
  const { lang } = useLanguage();
  const w = wizardCopy(lang);
  const [step, setStep] = useState(1);
  const [a, setA] = useState<ListingAnswers>(EMPTY);
  const [shots, setShots] = useState<Shot[]>([]);
  const [contact, setContact] = useState<ContactDetails>(NO_CONTACT);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /*
   * Which language the preview is showing.
   *
   * Both are written and both are published, but the panel only ever rendered
   * the Portuguese body — under English headings, beneath the English title.
   * An agent checking their listing saw a page that existed in neither
   * language, and had no way to check the English half at all. Portuguese
   * first because that is what the site serves by default.
   */
  const [view, setView] = useState<'pt' | 'en'>('pt');

  /*
   * Where the agent stands, asked when the wizard OPENS.
   *
   * Two reasons it is not left until Submit. An agent who is already at their
   * limit should be told before they spend twenty minutes and eight
   * photographs on a listing, and an agent on their last slot should know it
   * is their last — both are facts about their account, not a sales pitch, and
   * withholding them until the end is what makes a limit feel like a trap.
   *
   * It never blocks. The listing can be built either way; only publishing
   * needs an answer.
   */
  const [ent, setEnt] = useState<{
    state: GateState & { canPublish: boolean; remaining: number | null };
    upgrades: GatePlan[];
    oneOffs: GatePlan[];
    listings: GateListing[];
  } | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  const loadEntitlement = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/entitlement');
      if (!res.ok) return null;
      const data = await res.json();
      setEnt(data);
      return data;
    } catch {
      // A listing must still be buildable if this call fails; the server-side
      // check in createProperty is the one that actually decides.
      return null;
    }
  }, []);

  useEffect(() => { void loadEntitlement(); }, [loadEntitlement]);

  // Photo counts are derived from the real uploads rather than typed, which is
  // the one place this departs from the preview — the preview had no file
  // picker, so it asked the agent to type how many photos they had.
  const answers: ListingAnswers = useMemo(
    () => ({ ...a, photos: shots.length, interior: shots.filter((s) => s.interior).length }),
    [a, shots],
  );

  const g = useMemo(() => generateListing(answers), [answers]);
  const blockers = [
    ...(needsVerification ? [w.blocker.verifyEmail] : []),
    ...publishBlockers(answers, w.blocker, w.steps),
  ];
  const set = <K extends keyof ListingAnswers>(k: K, v: ListingAnswers[K]) =>
    setA((prev) => ({ ...prev, [k]: v }));

  function addFiles(files: FileList | null) {
    if (!files) return;
    // Read the FileList synchronously, here, and not inside the setShots
    // updater. `files` is a LIVE FileList owned by the <input>, and the caller
    // resets `input.value` the moment this returns so the same photo can be
    // picked twice. React runs the updater after that reset, by which point a
    // deferred Array.from() sees an empty list — which is why every upload
    // silently added nothing.
    const added = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      interior: false,
    }));
    setShots((prev) => [...prev, ...added]);
  }

  /*
   * Photos already uploaded, kept for the rest of this session.
   *
   * submit() can now run more than once — refused for quota, saved as a draft,
   * then submitted again after payment. Each run used to re-upload every
   * image, leaving orphaned Cloudinary assets and making the agent wait
   * through it again.
   */
  const [uploaded, setUploaded] = useState<string[] | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  async function submit(mode: 'publish' | 'draft' = 'publish') {
    setBusy(true);
    setError(null);
    setProgress(null);
    try {
      /*
       * Ask about room BEFORE uploading anything.
       *
       * submit() uploads every photograph to Cloudinary and only then calls
       * createProperty, so a quota refusal used to land after eight uploads —
       * a minute of the agent's time and eight stored assets for a listing
       * that was never created, repeated on every retry. This is a cheap
       * check against fresh server state; createProperty still decides.
       */
      if (mode === 'publish') {
        const fresh = await loadEntitlement();
        if (fresh && !fresh.state.canPublish) {
          setGateOpen(true);
          return;
        }
      }

      // Interior shots first: the cover photo is the one buyers judge on, and
      // a listing whose first frame is a gate tells them nothing.
      const ordered = [...shots].sort((x, y) => Number(y.interior) - Number(x.interior));

      const urls: string[] = uploaded ? [...uploaded] : [];
      for (const [i, shot] of (uploaded ? [] : ordered).entries()) {
        setProgress(`Uploading photo ${i + 1} of ${ordered.length}…`);
        const result = await uploadSingleImage(await compressImage(shot.file));
        if (!result.success || !result.url) {
          throw new Error(result.error || `"${shot.file.name}" could not be uploaded.`);
        }
        urls.push(result.url);
      }
      if (!uploaded) setUploaded(urls);
      setProgress(mode === 'draft' ? 'Saving your draft…' : 'Submitting for review…');

      const result = await createProperty(
        {
          title: g.title,
          titlePt: g.titlePt,
          description: g.ptDesc,
          descriptionEn: g.enDesc,
          metaEn: g.meta,
          metaPt: g.metaPt,
          city: answers.city,
          neighborhood: answers.bairro,
          latitude: answers.lat,
          longitude: answers.lng,
          address: answers.bairro,
          price: answers.price,
          priceUnit:
            answers.listingType === 'sale' ? 'sale' : answers.listingType === 'rent' ? 'monthly' : 'nightly',
          propertyType: answers.propertyType,
          listingType:
            answers.listingType === 'sale' ? 'Buy' : answers.listingType === 'rent' ? 'Rent' : 'Short Stay',
          bedrooms: answers.beds,
          bathrooms: answers.baths,
          area: answers.buildingSize || answers.landSize,
          /*
           * Furnishing left the chip list and became a three-way question, but
           * "Furnished" is still the amenity every furnishing filter matches
           * on — so it is derived back here rather than lost. Chips belonging
           * to another category are dropped at the same time, in case the
           * agent ticked some and then changed the property type.
           */
          amenities: [
            ...featuresInScope(answers),
            ...(answers.furnishing === 'full' ? ['Furnished']
              : answers.furnishing === 'semi' ? ['Semi-furnished']
              : []),
          ],
          /* The category answers, kept so the listing can be edited later
           * without the agent re-answering every question. */
          details: {
            condition: answers.condition, furnishing: answers.furnishing,
            suites: answers.suites, storeys: answers.storeys, floor: answers.floor,
            /* Collected on step 2 and, until now, discarded — which is why the
               commercial spec row had no parking figure to print. */
            parking: answers.parking,
            frontage: answers.frontage, depth: answers.depth,
            zoning: answers.zoning, duat: answers.duat,
            roadSurface: answers.roadSurface, structures: answers.structures,
            commercialUse: answers.commercialUse,
          },
          tags: [],
          asDraft: mode === 'draft',
          contactWhatsapp: contact.whatsapp.trim() || null,
          contactPhone: contact.phone.trim() || null,
          contactEmail: contact.email.trim() || null,
        },
        urls,
      );

      if (!result.success) {
        const message = 'error' in result ? String(result.error) : 'Could not submit the listing.';
        /*
         * A refusal about quota is not an error, it is a decision to offer.
         *
         * Showing "Your Standard (Free) plan covers 1 live listing…" as a red
         * failure message tells the agent they did something wrong, at the
         * exact moment they finished doing everything right. The same refusal
         * routed into the gate reads as a choice with three ways out.
         */
        const isQuota = /plan|listing limit|covers \d+ live/i.test(message);
        if (isQuota) {
          await loadEntitlement();
          setGateOpen(true);
        } else {
          setError(message);
        }
        return;
      }
      router.push('/dashboard/agent/listings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit the listing.');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{w.eyebrow}</p>
          <h1>{w.heading}</h1>
          <p>{w.intro}</p>
        </div>
        <span className={`pill ${g.band}`}>{w.quality} {g.score}</span>
      </div>

      {needsVerification && (
        <div className="alert warn" style={{ marginBottom: 14 }}>
          <Icon name="mail" size={18} />
          <div>
            <div className="a-title">{w.verifyTitle}</div>
            <div className="a-sub">{w.verifyBody(email ?? w.yourAddress)}</div>
          </div>
        </div>
      )}

      <div className="wiz">
        <div className="card">
          <div className="steps">
            {w.steps.map((label, i) => (
              <div
                key={label}
                className={`step${step === i + 1 ? ' on' : ''}${step > i + 1 ? ' done' : ''}`}
                onClick={() => setStep(i + 1)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStep(i + 1); } }}
              >
                <span className="sn">{step > i + 1 ? '✓' : i + 1}</span>
                {label}
              </div>
            ))}
          </div>

          <div style={{ padding: 18 }}>
            {ent && !ent.state.canPublish && (
              <div className="alert warn" style={{ marginBottom: 14 }}>
                <Icon name="info" size={18} />
                <div>
                  <div className="a-title">
                    {w.quotaUsedTitle(ent.state.quota, ent.state.planName ?? w.yourPlan)}
                  </div>
                  <p>{w.quotaUsedBody}</p>
                </div>
              </div>
            )}
            {/*
              * Where they stand, stated before they start rather than after.
              *
              * This used to appear only at one listing remaining, so an agent
              * with room simply saw nothing and had no way to know whether
              * this listing was going to cost them. Saying it every time is
              * what removes the need for a pricing step in the ordinary case.
              */}
            {ent && ent.state.canPublish && ent.state.credits === 0 && (
              <div className="alert" style={{ marginBottom: 14 }}>
                <Icon name={ent.state.remaining === 1 ? 'info' : 'check_circle'} size={18} />
                <div>
                  <div className="a-title">
                    {ent.state.remaining === 1
                      ? w.lastListingTitle(ent.state.planName ?? w.yourPlan)
                      : ent.state.quota === -1
                        ? w.allowanceUnlimited(ent.state.planName ?? w.yourPlan)
                        : w.allowanceTitle(ent.state.remaining ?? 0, ent.state.planName ?? w.yourPlan)}
                  </div>
                  <p>{ent.state.remaining === 1 ? w.lastListingBody : w.allowanceBody}</p>
                </div>
              </div>
            )}

            {step === 1 && <StepWhere a={a} set={set} w={w} />}
            {step === 2 && <StepNumbers a={a} set={set} w={w} />}
            {step === 3 && <StepCategory a={a} set={set} w={w} />}
            {step === 4 && <StepFeatures a={a} set={set} w={w} />}
            {step === 5 && <StepPlace a={a} set={set} w={w} />}
            {step === 7 && <StepContact contact={contact} set={setContact} w={w} />}
            {step === 6 && (
              <StepPhotos
                shots={shots}
                onAdd={addFiles}
                onToggleInterior={(i) =>
                  setShots((prev) => prev.map((s, j) => (j === i ? { ...s, interior: !s.interior } : s)))
                }
                onRemove={(i) => setShots((prev) => prev.filter((_, j) => j !== i))}
                slug={slugify(`${a.beds} bedroom ${a.propertyType} ${a.bairro} ${a.city}`)}
                w={w}
              />
            )}
          </div>

          {error && (
            <div className="alert crit" style={{ margin: '0 18px 14px' }}>
              <Icon name="error" size={18} />
              <div>
                <div className="a-title">{w.couldNotSubmit}</div>
                <div className="a-sub">{error}</div>
              </div>
            </div>
          )}

          <div className="vfoot">
            <button className="btn" onClick={() => setStep((s) => s - 1)} disabled={step === 1 || busy}>
              {w.back}
            </button>
            <span className="hint">
              {progress
                ?? (step === LAST && blockers.length > 0
                  ? blockers[0]
                  : step === LAST && ent?.state.canPublish
                    /* At the moment of publishing, the useful thing to say is
                       not which step they are on but what it will cost. */
                    ? `${w.includedBadge} — ${w.includedNote}`
                    : w.stepOf(step, LAST))}
            </span>
            <span className="spacer" />
            <button
              className="btn primary"
              disabled={busy || (step === LAST && blockers.length > 0)}
              onClick={() => (step === LAST ? submit() : setStep((s) => s + 1))}
            >
              {busy ? w.submitting : step === LAST ? w.submit : w.continue}
            </button>
          </div>
        </div>

        {gateOpen && ent && (
          <PublishGate
            state={ent.state}
            upgrades={ent.upgrades}
            oneOffs={ent.oneOffs}
            listings={ent.listings}
            onClose={() => setGateOpen(false)}
            onFreed={async () => {
              const fresh = await loadEntitlement();
              if (fresh?.state?.canPublish) {
                setGateOpen(false);
                void submit();
              }
            }}
            onSaveDraft={async () => {
              setSavingDraft(true);
              try {
                setGateOpen(false);
                await submit('draft');
              } finally {
                setSavingDraft(false);
              }
            }}
            savingDraft={savingDraft}
            onPaid={async () => {
              await loadEntitlement();
              setGateOpen(false);
              setProgress(null);
              setError(w.paymentStarted);
            }}
          />
        )}

        <div className="card" style={{ position: 'sticky', top: 70 }}>
          <div className="card-head">
            <h3>{w.previewTitle}</h3>
            <div className="lp-langs" role="group" aria-label={w.previewLanguage}>
              {(['pt', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className={view === l ? 'lp-lang is-on' : 'lp-lang'}
                  aria-pressed={view === l}
                  onClick={() => setView(l)}
                >
                  {l === 'pt' ? 'Português' : 'English'}
                </button>
              ))}
            </div>
          </div>

          <ListingPreview g={g} a={answers} shots={shots} contact={contact} view={view} w={w} />

          <details className="seo-fold">
            <summary>{w.seoSummary}</summary>

            <div style={{ padding: '4px 16px 10px' }}>
              <div className="serp">
                <div className="s-url">{g.url}</div>
                <div className="s-title">{view === 'pt' ? g.titleFullPt : g.titleFull}</div>
                <div className="s-desc">{view === 'pt' ? g.metaPt : g.meta}</div>
              </div>
              <div className="s-note">
                {view === 'pt' ? w.seoNotePt : w.seoNoteEn}
              </div>
            </div>

            <OutRow label={w.urlSlug} note={w.chars(g.slug.length)}>/properties/{g.slug}</OutRow>
            <OutRow
              label={w.titleTag}
              note={<Count n={(view === 'pt' ? g.titleFullPt : g.titleFull).length} lo={40} hi={60} max={60} />}
            >
              {view === 'pt' ? g.titleFullPt : g.titleFull}
            </OutRow>
            {(view === 'pt' ? g.titleFullPt : g.titleFull).length > 60 && (
              <div style={{ padding: '0 16px 10px', fontSize: 11.5, lineHeight: 1.4, color: 'var(--d-warn)', fontWeight: 600 }}>
                {w.titleTooLong}
              </div>
            )}
            <OutRow
              label={w.metaDescription}
              note={<Count n={(view === 'pt' ? g.metaPt : g.meta).length} lo={140} hi={160} max={160} />}
            >
              {view === 'pt' ? g.metaPt : g.meta}
            </OutRow>
            <OutRow label={w.portuguesePair} note="hreflang">{g.ptSlug}</OutRow>
            <OutRow label={w.parentPage}>{g.parent}</OutRow>
            <div className="outrow">
              <h6>{w.structuredData} <span>RealEstateListing</span></h6>
              <div className="val" style={{ maxHeight: 150, overflow: 'auto', whiteSpace: 'pre', wordBreak: 'normal' }}>
                {JSON.stringify(g.jsonld, null, 1)}
              </div>
            </div>
          </details>

          <div className="vfoot">
            <span className="hint">{w.generatedNote}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * What the agent is actually publishing.
 *
 * The panel used to open on the slug, the title-tag character count and the
 * JSON-LD. All of that is real and still here, folded away at the bottom, but
 * it is a developer's view of a listing — an agent cannot tell from a meta
 * description whether their property looks worth calling about. So the first
 * thing they see is the listing: the photos they uploaded, the price, the
 * details table and the description, laid out the way the public page lays
 * them out.
 */
/**
 * The strings the preview frames the listing with.
 *
 * These are the public page's chrome, so they follow the PREVIEWED language,
 * which is chosen independently of the language the agent is working in — an
 * agent reading the form in Portuguese still needs to check how the English
 * version of the page will read.
 *
 * The wizard's own words are in listing-wizard-copy.ts and follow the agent.
 */
const PREVIEW_COPY = {
  pt: {
    details: 'Detalhes do imóvel',
    description: 'Descrição do imóvel',
    contact: 'Contactar o agente',
    noPrice: 'Sem preço ainda',
    photos: 'As suas fotos aparecem aqui',
    call: 'Ligar',
    email: 'Email',
    perMonth: ' / mês',
    perNight: ' / noite',
    yes: 'Sim',
    no: 'Não',
    rows: {
      advert: 'Tipo de anúncio', type: 'Tipo de imóvel', beds: 'Quartos',
      baths: 'Casas de banho', built: 'Área de construção', plot: 'Área do terreno',
      parking: 'Estacionamento', furnished: 'Mobilada', address: 'Endereço',
    },
    intent: { sale: 'À venda', rent: 'Para arrendar', stay: 'Férias' },
  },
  en: {
    details: 'Property details',
    description: 'Property description',
    contact: 'Contact the agent',
    noPrice: 'No price yet',
    photos: 'Your photos appear here',
    call: 'Call',
    email: 'Email',
    perMonth: ' / month',
    perNight: ' / night',
    yes: 'Yes',
    no: 'No',
    rows: {
      advert: 'Advert type', type: 'Property type', beds: 'Bedrooms',
      baths: 'Bathrooms', built: 'Built area', plot: 'Plot size',
      parking: 'Parking', furnished: 'Furnished', address: 'Address',
    },
    intent: { sale: 'For sale', rent: 'To rent', stay: 'Short stay' },
  },
} as const;

function ListingPreview({
  g, a, shots, contact, view, w,
}: {
  g: GeneratedListing;
  a: ListingAnswers;
  shots: Shot[];
  contact: ContactDetails;
  view: 'pt' | 'en';
  /* The agent's language, for the one line here that is advice to them rather
     than part of the page a buyer would see. */
  w: WizardCopy;
}) {
  const c = PREVIEW_COPY[view];
  const pt = view === 'pt';
  const cover = shots.find((x) => !x.interior) ?? shots[0];
  const rest = shots.filter((x) => x !== cover).slice(0, 4);

  const priceLabel = a.price
    ? `${new Intl.NumberFormat('en-US').format(a.price)} ${a.currency}${
        a.listingType === 'rent' ? c.perMonth : a.listingType === 'short stay' ? c.perNight : ''
      }`
    : c.noPrice;

  const details: Array<[string, string]> = [
    [c.rows.advert, a.listingType === 'sale' ? c.intent.sale : a.listingType === 'rent' ? c.intent.rent : c.intent.stay],
    // Property.type is stored in English and translated at the edge, exactly as
    // the live listing page does it.
    [c.rows.type, pt ? PT_TYPE[a.propertyType] ?? a.propertyType : a.propertyType],
    [c.rows.beds, a.beds ? String(a.beds) : '—'],
    [c.rows.baths, a.baths ? String(a.baths) : '—'],
    [c.rows.built, a.buildingSize ? `${a.buildingSize} m²` : '—'],
    [c.rows.plot, a.landSize ? `${a.landSize} m²` : '—'],
    [c.rows.parking, a.parking ? String(a.parking) : '—'],
    [c.rows.furnished, a.features.includes('Furnished') ? c.yes : c.no],
    [c.rows.address, [a.bairro, a.city].filter(Boolean).join(', ') || '—'],
  ];

  return (
    <div className="lp">
      {/* gallery */}
      {cover ? (
        <div className="lp-gallery">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lp-cover" src={cover.preview} alt="" />
          {rest.length > 0 && (
            <div className="lp-thumbs">
              {rest.map((sh) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={sh.preview} src={sh.preview} alt="" />
              ))}
              {shots.length > 5 && <span className="lp-more">+{shots.length - 5}</span>}
            </div>
          )}
        </div>
      ) : (
        <div className="lp-gallery lp-gallery--empty">
          <Icon name="add_a_photo" size={26} />
          <span>{c.photos}</span>
        </div>
      )}

      <div className="lp-body">
        <h4 className="lp-title">{pt ? g.titlePt : g.title}</h4>
        <div className="lp-price">{priceLabel}</div>

        <div className="lp-section-h">{c.details}</div>
        <div className="lp-details">
          {details.map(([k, v]) => (
            <div key={k} className="lp-detail">
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>

        <div className="lp-section-h">{c.description}</div>
        <ListingDescription text={pt ? g.ptDesc : g.enDesc} className="lp-desc" />

        <div className="lp-section-h">{c.contact}</div>
        <div className="lp-contact">
          {contact.whatsapp.trim() && <span className="lp-cta lp-cta--wa"><Icon name="chat" size={14} />WhatsApp</span>}
          {contact.phone.trim() && <span className="lp-cta"><Icon name="call" size={14} />{c.call}</span>}
          {contact.email.trim() && <span className="lp-cta"><Icon name="mail" size={14} />{c.email}</span>}
          {!contact.whatsapp.trim() && !contact.phone.trim() && !contact.email.trim() && (
            <span className="lp-contact-none">{w.previewContactFallback}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function OutRow({ label, note, children }: { label: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="outrow">
      <h6>{label}{note != null && <span>{note}</span>}</h6>
      <div className="val">{children}</div>
    </div>
  );
}

function Count({ n, lo, hi, max }: { n: number; lo: number; hi: number; max: number }) {
  const cls = n > hi ? 'over' : n < lo ? 'under' : 'ok';
  return <><span className={`cnt ${cls}`}>{n}</span> / {max}</>;
}

/* ---------------------------------------------------------------- steps */

type Setter = <K extends keyof ListingAnswers>(k: K, v: ListingAnswers[K]) => void;

function Ask({ q, why }: { q: string; why: string }) {
  return (
    <>
      <p className="ask">{q}</p>
      <p className="askwhy">{why}</p>
    </>
  );
}

function StepWhere({ a, set, w }: { a: ListingAnswers; set: Setter; w: WizardCopy }) {
  return (
    <>
      <Ask q={w.whereQ} why={w.whereWhy} />
      <div className="fieldrow">
        <label className="field">
          <span>{w.listingType}</span>
          <select
            className="select"
            value={a.listingType}
            onChange={(e) => set('listingType', e.target.value as ListingIntent)}
          >
            <option value="sale">{w.intentSale}</option>
            <option value="rent">{w.intentRent}</option>
            <option value="short stay">{w.intentStay}</option>
          </select>
        </label>
        <label className="field">
          <span>{w.propertyType}</span>
          <select className="select" value={a.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
            {PROPERTY_TYPES.map((v) => (
              /* Stored in English on Property.type and translated at the edge,
                 exactly as the live listing page does it. */
              <option key={v} value={v}>{PT_TYPE_OPTION(w, v)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{w.city}</span>
          <select className="select" value={a.city} onChange={(e) => set('city', e.target.value)}>
            {CITIES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{w.bairro}</span>
          <input value={a.bairro} onChange={(e) => set('bairro', e.target.value)} placeholder={w.bairroPlaceholder} />
        </label>
      </div>
    </>
  );
}

function NumField({
  label, value, onChange, hint, blank,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
  /** Renders empty although `value` is 0 — for a floor, where 0 means ground. */
  blank?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={0}
        value={blank ? '' : (value || value === 0 ? String(value) : '')}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
      {hint && <small className="fieldhint">{hint}</small>}
    </label>
  );
}

/** Every numeric answer, with the label and the help each one needs. */
function numField(w: WizardCopy, key: string): { label: string; hint?: string } {
  const n = w.num;
  switch (key) {
    case 'beds': return { label: n.beds };
    case 'baths': return { label: n.baths };
    case 'suites': return { label: n.suites, hint: n.suitesHint };
    case 'storeys': return { label: n.storeys, hint: n.storeysHint };
    case 'floor': return { label: n.floor, hint: n.floorHint };
    case 'parking': return { label: n.parking };
    case 'buildingSize': return { label: n.buildingSize };
    case 'landSize': return { label: n.landSize };
    case 'frontage': return { label: n.frontage, hint: n.frontageHint };
    case 'depth': return { label: n.depth };
    default: return { label: key };
  }
}

function StepNumbers({ a, set, w }: { a: ListingAnswers; set: Setter; w: WizardCopy }) {
  const type = a.propertyType as CategoryKey;
  const fields = NUMERIC_FIELDS[type] ?? NUMERIC_FIELDS.House;
  const sanity = AREA_SANITY[type] ?? AREA_SANITY.House;

  /*
   * A size far outside what the category plausibly is, flagged and not blocked.
   *
   * A three-bedroom apartment went live at 23,323 m², because the input had a
   * floor of 0 and no ceiling, and that number reached the description, the
   * title tag and the JSON-LD unchallenged. Some properties really are large,
   * so this warns rather than refuses — which is all a typo needs.
   */
  const tooBig =
    (sanity.building > 0 && a.buildingSize > sanity.building && w.buildingSizeLabel)
    || (sanity.land > 0 && a.landSize > sanity.land && w.plotSizeLabel)
    || null;

  return (
    <>
      <Ask q={w.numbersQ} why={w.numbersWhy} />
      <div className="fieldrow">
        {fields.map((f) => (
          <NumField
            key={f}
            label={numField(w, f).label}
            hint={numField(w, f).hint}
            // -1 is "not answered" for a floor, where 0 is a real answer.
            value={f === 'floor' ? (a.floor < 0 ? 0 : a.floor) : (a[f as keyof ListingAnswers] as number)}
            blank={f === 'floor' && a.floor < 0}
            onChange={(n) => set(f as keyof ListingAnswers, n as never)}
          />
        ))}
        <NumField label={w.price} value={a.price} onChange={(n) => set('price', n)} />
        <label className="field">
          <span>{w.currency}</span>
          <select className="select" value={a.currency} onChange={(e) => set('currency', e.target.value as 'MZN' | 'USD')}>
            <option value="MZN">MZN</option>
            <option value="USD">USD</option>
          </select>
        </label>
      </div>

      {tooBig && (
        <p className="askwhy" style={{ marginTop: 12, color: 'var(--d-warn)', fontWeight: 600 }}>
          {w.tooBig(tooBig, PT_TYPE_OPTION(w, a.propertyType).toLowerCase())}
        </p>
      )}

      {/*
        * Frontage x depth and the stated plot size should agree.
        *
        * A plot went live at "12 m²" with a frontage of 32 m and a depth of
        * 23 m — 736 m². Both numbers reached the page, contradicting each
        * other in the spec table and the description. A 15% tolerance leaves
        * room for an irregular plot without letting a transposed digit past.
        */}
      {a.frontage > 0 && a.depth > 0 && a.landSize > 0
        && Math.abs(a.frontage * a.depth - a.landSize) > a.landSize * 0.15 && (
        <p className="askwhy" style={{ marginTop: 12, color: 'var(--d-warn)', fontWeight: 600 }}>
          {w.areaMismatch(a.frontage, a.depth, a.frontage * a.depth, a.landSize)}
        </p>
      )}

      {a.suites > a.beds && a.beds > 0 && (
        <p className="askwhy" style={{ marginTop: 12, color: 'var(--d-warn)', fontWeight: 600 }}>
          {w.suitesOverBeds}
        </p>
      )}

      <p className="askwhy" style={{ marginTop: 12 }}>
        {w.priceNote}
      </p>
    </>
  );
}

/** The questions only this category is asked. */
function StepCategory({ a, set, w }: { a: ListingAnswers; set: Setter; w: WizardCopy }) {
  const type = a.propertyType as CategoryKey;
  const qs = CATEGORY_QUESTIONS[type] ?? [];
  const land = !isBuilt(a.propertyType);

  return (
    <>
      <Ask q={land ? w.plotQ : w.buildingQ} why={land ? w.plotWhy : w.buildingWhy} />
      <div className="fieldrow">
        {qs.map((q) => (
          <label className="field" key={q}>
            <span>{w.question[q as keyof typeof w.question] ?? q}</span>
            <select
              className="select"
              value={a[q] as string}
              onChange={(e) => set(q, e.target.value as never)}
            >
              {/* Not "Not sure yet": that read as a valid answer, and for a
                * required question it left Submit disabled with no way out. */}
              <option value="">{w.select}</option>
              {CHOICES[q].map((v) => (
                <option key={v} value={v}>{w.choice[v] ?? v}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </>
  );
}

function StepFeatures({ a, set, w }: { a: ListingAnswers; set: Setter; w: WizardCopy }) {
  return (
    <>
      <Ask
        q={isBuilt(a.propertyType) ? w.featuresBuiltQ : w.featuresLandQ}
        why={w.featuresWhy}
      />
      {featureGroupsFor(a.propertyType).map((group) => (
        <div key={group.key} style={{ marginTop: 16 }}>
          <h6
            style={{
              margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '.07em',
              textTransform: 'uppercase', color: 'var(--d-text-3)',
            }}
          >
            {group.label}
          </h6>
          <div className="chipgrid">
            {group.items.map((f) => (
              <button
                key={f}
                type="button"
                className={`fchip${a.features.includes(f) ? ' on' : ''}`}
                onClick={() =>
                  set('features', a.features.includes(f) ? a.features.filter((x) => x !== f) : [...a.features, f])
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function StepPlace({ a, set, w }: { a: ListingAnswers; set: Setter; w: WizardCopy }) {
  const [paste, setPaste] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  const point = a.lat != null && a.lng != null ? { lat: a.lat, lng: a.lng } : null;
  const centre = CITY_CENTRE[a.city] ?? DEFAULT_CENTRE;

  function applyPasted(text: string) {
    setPaste(text);
    setPasteError(null);
    if (!text.trim()) return;

    const found = parseLatLng(text);
    if (found) {
      set('lat', found.lat);
      set('lng', found.lng);
      return;
    }
    /*
     * A shortened Google link is a redirect to the real one. Resolving it
     * needs a server round trip that would hand an arbitrary agent-supplied
     * URL to fetch(), so the agent opens it instead — one tap, and the address
     * bar then holds the full link this box can read.
     */
    setPasteError(isShortMapLink(text) ? w.shortLinkError : w.noCoordsError);
  }

  return (
    <>
      <Ask q={w.nearQ} why={w.nearWhy} />
      <div className="fieldrow">
        {[0, 1, 2].map((i) => (
          <label className="field" key={i}>
            <span>{w.landmark(i + 1)}</span>
            <input
              value={a.near[i] ?? ''}
              placeholder={w.landmarkPlaceholder}
              onChange={(e) => set('near', a.near.map((v, j) => (j === i ? e.target.value : v)))}
            />
          </label>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        <Ask q={w.mapQ} why={w.mapWhy} />

        <label className="field" style={{ marginBottom: 12 }}>
          <span>{w.pasteLink}</span>
          <input
            value={paste}
            placeholder={w.pastePlaceholder}
            onChange={(e) => applyPasted(e.target.value)}
          />
          <small className="fieldhint">
            {w.pasteHint}
          </small>
        </label>

        {pasteError && (
          <p className="askwhy" style={{ color: 'var(--d-warn)', fontWeight: 600, marginBottom: 12 }}>
            {pasteError}
          </p>
        )}

        <MapPicker
          value={point}
          centre={centre}
          onPick={(pt) => { set('lat', pt.lat); set('lng', pt.lng); setPasteError(null); }}
        />

        {point ? (
          <p className="askwhy" style={{ marginTop: 10 }}>
            {w.pinSet} <b>{formatLatLng(point)}</b>.{' '}
            <button
              type="button"
              className="linkish"
              onClick={() => { set('lat', null); set('lng', null); setPaste(''); }}
            >
              {w.clear}
            </button>
            {looksOutsideMozambique(point) && (
              <span style={{ color: 'var(--d-warn)', fontWeight: 600 }}>
                {w.outsideMozambique}
              </span>
            )}
          </p>
        ) : (
          <p className="askwhy" style={{ marginTop: 10 }}>
            {w.noPin}
          </p>
        )}
      </div>
    </>
  );
}

function StepPhotos({
  shots, onAdd, onToggleInterior, onRemove, slug, w,
}: {
  shots: Shot[];
  onAdd: (f: FileList | null) => void;
  onToggleInterior: (i: number) => void;
  onRemove: (i: number) => void;
  slug: string;
  w: WizardCopy;
}) {
  const interior = shots.filter((s) => s.interior).length;
  return (
    <>
      <Ask q={w.photosQ} why={w.photosWhy} />

      <label className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
        <Icon name="add_a_photo" size={15} />
        {w.addPhotos}
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => { onAdd(e.target.files); e.target.value = ''; }}
        />
      </label>

      {shots.length > 0 && (
        <div className="chipgrid" style={{ marginTop: 14 }}>
          {shots.map((s, i) => (
            <div key={s.preview} style={{ width: 104 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.preview}
                alt=""
                style={{ width: 104, height: 78, objectFit: 'cover', borderRadius: 'var(--d-radius-sm)', display: 'block' }}
              />
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <button
                  type="button"
                  className={`fchip${s.interior ? ' on' : ''}`}
                  style={{ flex: 1, fontSize: 11 }}
                  onClick={() => onToggleInterior(i)}
                >
                  {w.interior}
                </button>
                <button type="button" className="fchip" style={{ fontSize: 11 }} onClick={() => onRemove(i)}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="checks" style={{ marginTop: 14 }}>
        <Check ok={shots.length >= 6}>
          {shots.length >= 6 ? w.photosEnough(shots.length) : w.photosShort(shots.length)}
        </Check>
        <Check ok={interior >= 2}>
          {interior >= 2 ? w.interiorEnough(interior) : w.interiorShort}
        </Check>
        <Check ok>
          {w.filenamesGenerated}{' '}
          <span className="mono" style={{ fontSize: 11.5 }}>{slug}-01.webp</span>
        </Check>
      </div>
    </>
  );
}

function StepContact({
  contact, set, w,
}: {
  contact: ContactDetails;
  set: (c: ContactDetails) => void;
  w: WizardCopy;
}) {
  const none = !contact.whatsapp.trim() && !contact.phone.trim() && !contact.email.trim();

  return (
    <>
      <Ask q={w.contactQ} why={w.contactWhy} />
      <div className="fieldrow">
        <label className="field">
          <span>{w.whatsappNumber}</span>
          <input
            value={contact.whatsapp}
            placeholder="+258 84 000 0000"
            onChange={(e) => set({ ...contact, whatsapp: e.target.value })}
          />
        </label>
        <label className="field">
          <span>{w.phoneNumber}</span>
          <input
            value={contact.phone}
            placeholder="+258 21 000 000"
            onChange={(e) => set({ ...contact, phone: e.target.value })}
          />
        </label>
        <label className="field">
          <span>{w.emailLabel}</span>
          <input
            type="email"
            value={contact.email}
            placeholder={w.emailPlaceholder}
            onChange={(e) => set({ ...contact, email: e.target.value })}
          />
        </label>
      </div>

      <div className="checks" style={{ marginTop: 14 }}>
        <Check ok={Boolean(contact.whatsapp.trim())}>
          {contact.whatsapp.trim() ? w.waOn : w.waOff}
        </Check>
        <Check ok={Boolean(contact.phone.trim())}>
          {contact.phone.trim() ? w.callOn : w.callOff}
        </Check>
        <Check ok={Boolean(contact.email.trim())}>
          {contact.email.trim() ? w.mailOn : w.mailOff}
        </Check>
      </div>

      {none && (
        <p className="askwhy" style={{ marginTop: 12 }}>
          {w.contactFallback}
        </p>
      )}
    </>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className={`check ${ok ? 'pass' : 'fail'}`}>
      <Icon name={ok ? 'check_circle' : 'error'} size={15} />
      <span>{children}</span>
    </div>
  );
}
