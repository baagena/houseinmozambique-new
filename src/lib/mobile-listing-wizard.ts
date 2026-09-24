/**
 * The guided-listing wizard, served to the mobile app.
 *
 * The app renders the same questions the web wizard asks and sends the answers
 * back; the listing itself is composed here by generateListing(), so the app
 * never carries its own copy of the question set or of the prose rules.
 */
import { wizardCopy } from '@/components/dashboard/listing-wizard-copy';
import {
  AMENITY_LABEL_PT, CATEGORY_QUESTIONS, CHOICES, CITIES, EMPTY_CATEGORY_ANSWERS, NUMERIC_FIELDS,
  PROPERTY_TYPES, PT_TYPE, REQUIRES_INTERIOR_SHOTS, featureGroupsFor, isBuilt, publishBlockers,
  type CategoryKey, type ListingAnswers,
} from '@/lib/listing-copy';
import type { ListingContact } from '@/lib/listing-wizard-payload';

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | '' =>
  allowed.includes(v as T) ? (v as T) : '';

/** JSON from the app, coerced into a ListingAnswers the generator can trust. */
export function normalizeAnswers(raw: unknown): ListingAnswers {
  const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const propertyType = (PROPERTY_TYPES as readonly string[]).includes(str(a.propertyType))
    ? str(a.propertyType)
    : 'House';
  const lat = a.lat === null || a.lat === undefined ? null : num(a.lat, NaN);
  const lng = a.lng === null || a.lng === undefined ? null : num(a.lng, NaN);
  const hasPin = lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng);

  return {
    ...EMPTY_CATEGORY_ANSWERS,
    listingType: oneOf(a.listingType, ['sale', 'rent', 'short stay'] as const) || 'sale',
    propertyType,
    city: str(a.city).trim() || 'Maputo',
    bairro: str(a.bairro).trim(),
    beds: Math.max(0, num(a.beds)),
    baths: Math.max(0, num(a.baths)),
    parking: Math.max(0, num(a.parking)),
    buildingSize: Math.max(0, num(a.buildingSize)),
    landSize: Math.max(0, num(a.landSize)),
    price: Math.max(0, num(a.price)),
    currency: a.currency === 'USD' ? 'USD' : 'MZN',
    features: Array.isArray(a.features) ? a.features.filter((f): f is string => typeof f === 'string') : [],
    near: Array.isArray(a.near) ? a.near.map(str).slice(0, 3) : ['', '', ''],
    lat: hasPin ? lat : null,
    lng: hasPin ? lng : null,
    photos: Math.max(0, num(a.photos)),
    interior: Math.max(0, num(a.interior)),
    condition: oneOf(a.condition, CHOICES.condition),
    suites: Math.max(0, num(a.suites)),
    storeys: Math.max(0, num(a.storeys)),
    furnishing: oneOf(a.furnishing, CHOICES.furnishing),
    floor: a.floor === null || a.floor === undefined || a.floor === '' ? -1 : num(a.floor, -1),
    frontage: Math.max(0, num(a.frontage)),
    depth: Math.max(0, num(a.depth)),
    zoning: oneOf(a.zoning, CHOICES.zoning),
    duat: oneOf(a.duat, CHOICES.duat),
    roadSurface: oneOf(a.roadSurface, CHOICES.roadSurface),
    structures: oneOf(a.structures, CHOICES.structures),
    commercialUse: oneOf(a.commercialUse, CHOICES.commercialUse),
  };
}

export function normalizeContact(raw: unknown): ListingContact {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return { whatsapp: str(c.whatsapp), phone: str(c.phone), email: str(c.email) };
}

const capFirst = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);

/** Everything the app needs to draw the wizard, in the agent's language. */
export function wizardSchema(lang: string) {
  const w = wizardCopy(lang);
  const pt = w.isPt;

  // Only the plain strings travel; the copy's functions (step counters,
  // blockers) are either rebuilt in the app or evaluated server-side.
  const text: Record<string, string> = {};
  for (const [key, value] of Object.entries(w)) {
    if (typeof value === 'string') text[key] = value;
  }

  const types = PROPERTY_TYPES as readonly CategoryKey[];
  return {
    steps: w.steps,
    text,
    numLabels: w.num,
    intents: [
      { value: 'sale', label: w.intentSale },
      { value: 'rent', label: w.intentRent },
      { value: 'short stay', label: w.intentStay },
    ],
    propertyTypes: types.map((t) => ({ value: t, label: pt ? PT_TYPE[t] ?? t : t })),
    cities: CITIES,
    categories: Object.fromEntries(types.map((t) => [t, {
      built: isBuilt(t),
      requiresInterior: REQUIRES_INTERIOR_SHOTS[t],
      numericFields: NUMERIC_FIELDS[t],
      questions: CATEGORY_QUESTIONS[t].map((q) => ({
        key: q,
        label: w.question[q],
        choices: CHOICES[q].map((c) => ({ value: c, label: w.choice[c] ?? c })),
      })),
      featureGroups: featureGroupsFor(t).map((g) => ({
        key: g.key,
        label: pt ? g.labelPt : g.label,
        items: g.items.map((f) => ({ value: f, label: pt && AMENITY_LABEL_PT[f] ? capFirst(AMENITY_LABEL_PT[f]) : f })),
      })),
    }])),
  };
}

/** Why the listing cannot be submitted yet, worded in the agent's language. */
export function wizardBlockers(a: ListingAnswers, lang: string): string[] {
  const w = wizardCopy(lang);
  return publishBlockers(a, w.blocker, w.steps);
}
