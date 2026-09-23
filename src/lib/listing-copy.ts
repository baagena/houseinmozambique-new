/**
 * Listing copy, composed from the agent's answers.
 *
 * Ported from `generate()` in the design package's ops-console-preview.html,
 * which the console CSS names as the source of truth. The preview labels this
 * output "built from your answers · not AI", and that is the whole point of the
 * module: every string below is a pure function of the structured answers, so
 * the same answers always produce the same page, nothing is invented, and it
 * runs with no API key, no network call and no latency.
 *
 * This deliberately does NOT go through src/lib/listing-draft.ts, which asks a
 * model to read a paragraph of free text. That path still exists for agents who
 * would rather paste a WhatsApp message, but it cannot run without
 * ANTHROPIC_API_KEY and it cannot promise the same answers twice.
 *
 * Portuguese is generated as well as English because the preview's own SEO
 * screen notes that PT is the primary language of this market.
 */

import {
  CATEGORY_LABEL_EN, CATEGORY_LABEL_PT, FEATURE_SCOPE,
  REQUIRES_INTERIOR_SHOTS, isBuilt,
  type CategoryAnswers, type CategoryKey,
} from './listing-categories';

export * from './listing-categories';

export type ListingIntent = 'sale' | 'rent' | 'short stay';

export interface ListingAnswers extends CategoryAnswers {
  listingType: ListingIntent;
  propertyType: string;
  city: string;
  bairro: string;
  beds: number;
  baths: number;
  parking: number;
  buildingSize: number;
  landSize: number;
  price: number;
  currency: 'MZN' | 'USD';
  features: string[];
  /** Real nearby landmarks. Blank entries are dropped, never padded. */
  near: string[];
  /** The map pin. Null until the agent picks one; never guessed from the city. */
  lat: number | null;
  lng: number | null;
  photos: number;
  interior: number;
}

export const PROPERTY_TYPES = ['House', 'Apartment', 'Land', 'Commercial', 'Beach house'] as const;

export const CITIES = [
  'Maputo', 'Matola', 'Beira', 'Nampula', 'Pemba', 'Inhambane', 'Vilanculos', 'Xai-Xai',
] as const;

/**
 * Features, grouped the way a listing reads rather than as one flat list.
 *
 * The grouping does two jobs: it gives the wizard headed sections to tick
 * through, and it gives the generated description its shape. A professional
 * listing does not run "pool, furnished, security, borehole" together in one
 * line — it separates what is inside from what is outside from what the estate
 * provides, because a buyer scanning for a generator is not reading the
 * sentence about the kitchen.
 */
export const FEATURE_GROUPS = [
  {
    key: 'indoor',
    label: 'Indoor',
    labelPt: 'Interior',
    // "Furnished" used to sit here as a yes/no. It is now a three-way question
    // (unfurnished / semi / full), because a binary could not say
    // "semimobilado" — so agents wrote that into the body and left the chip
    // off, which made the property invisible to a furnishing filter.
    items: ['Air conditioning', 'Ensuite bedroom', 'Fibre internet'],
  },
  {
    key: 'outdoor',
    label: 'Outdoor',
    labelPt: 'Exterior',
    items: ['Pool', 'Garden', 'Sea view', 'Direct beach access'],
  },
  {
    key: 'services',
    label: 'Security & services',
    labelPt: 'Segurança e serviços',
    items: ['24/7 security', 'Backup generator', 'Borehole / water tank', 'Solar', 'Lift'],
  },
  {
    key: 'annex',
    label: 'Annex',
    labelPt: 'Anexos',
    items: ['Outdoor kitchen', 'Store room', 'Staff quarters', 'Additional bathroom'],
  },
  {
    // The ground itself. Land was previously offered none of this and all of
    // the indoor chips instead.
    key: 'plot',
    label: 'The plot',
    labelPt: 'O terreno',
    items: [
      'Walled / fenced', 'Corner plot', 'Not flood-prone',
      'Water at the boundary', 'Electricity at the boundary',
    ],
  },
  {
    key: 'paperwork',
    label: 'Paperwork',
    labelPt: 'Documentação',
    items: ['DUAT in order'],
  },
] as const;

/**
 * The chip groups a given category is actually asked, empty groups removed.
 *
 * FEATURE_SCOPE lists the categories each chip belongs to; anything missing
 * from the map is shown everywhere, so adding a chip without a scope entry
 * fails open rather than silently vanishing.
 */
export function featureGroupsFor(propertyType: string) {
  return FEATURE_GROUPS
    .map((g) => ({
      ...g,
      items: g.items.filter((f) => {
        const scope = FEATURE_SCOPE[f];
        return !scope || scope.includes(propertyType as CategoryKey);
      }),
    }))
    .filter((g) => g.items.length > 0);
}

/**
 * Amenities that belong to a group but are not chips in it.
 *
 * "Furnished" left the Indoor chip list when furnishing became a three-way
 * question, but the wizard still derives it into `amenities` so the existing
 * filter keeps matching — which left every furnished listing showing
 * "Mobilada" in the unrecognised bucket at the bottom of the page. It is an
 * indoor fact and it is filed as one.
 */
const EXTRA_GROUP: Record<string, string> = {
  Furnished: 'indoor',
  'Semi-furnished': 'indoor',
};

/**
 * A listing's stored amenities, sorted back into the groups they were ticked in.
 *
 * The property page showed them as one flat run of checkmarks. That is fine for
 * four, but a house can carry a dozen or more, and "Pool, Furnished, 24/7
 * security, Borehole, Store room, DUAT in order" in one undifferentiated column
 * is the wall of text the grouping exists to prevent — a buyer scanning for a
 * generator should not have to read the entry about the kitchen.
 *
 * Anything not recognised keeps its place rather than being dropped: the
 * listings imported before the guided wizard carry free-text amenities that
 * match no group, and silently hiding them would remove real facts from the
 * page. They collect in a trailing group with no heading.
 */
export function groupAmenities(amenities: string[]) {
  const seen = new Set<string>();
  const groups = FEATURE_GROUPS.map((g) => {
    const items = amenities.filter(
      (a) => (g.items as readonly string[]).includes(a) || EXTRA_GROUP[a] === g.key,
    );
    items.forEach((a) => seen.add(a));
    return { key: g.key as string, label: g.label as string, labelPt: g.labelPt as string, items };
  }).filter((g) => g.items.length > 0);

  const rest = amenities.filter((a) => !seen.has(a));
  // The trailing group is HEADED. Left unlabelled it rendered flush under the
  // previous group's list, so "Mobilada" read as a line of Documentação.
  return rest.length
    ? [...groups, { key: 'other', label: 'Other', labelPt: 'Outros', items: rest }]
    : groups;
}

/** Chips that do not belong to this category are dropped, not carried along. */
export const featuresInScope = (a: ListingAnswers) =>
  a.features.filter((f) => {
    const scope = FEATURE_SCOPE[f];
    return !scope || scope.includes(a.propertyType as CategoryKey);
  });

export const FEATURES = FEATURE_GROUPS.flatMap((g) => g.items);

/**
 * Property.type is stored in English — it is data, matched on by every filter,
 * so it is translated at the edge rather than at write time.
 *
 * Exported because the listing page needs exactly this map to label the
 * specification table, and two copies of it drift: this one gained
 * "Beach house" while the page's copy gained "Villa", so each language was
 * missing a type the other had.
 */
export const PT_TYPE: Record<string, string> = {
  House: 'Moradia',
  Apartment: 'Apartamento',
  Land: 'Terreno',
  Commercial: 'Espaço comercial',
  'Beach house': 'Casa de praia',
  Villa: 'Vivenda',
  Penthouse: 'Cobertura',
  Studio: 'Estúdio',
  Bungalow: 'Bungalow',
  Lodge: 'Lodge',
};

const PT_TYPE_SLUG: Record<string, string> = {
  House: 'casas',
  Apartment: 'apartamentos',
  Land: 'terrenos',
  Commercial: 'espacos-comerciais',
  'Beach house': 'casas-de-praia',
};

const EN_TYPE_SLUG: Record<string, string> = {
  House: 'houses',
  Apartment: 'apartments',
  Land: 'land',
  Commercial: 'commercial-property',
  'Beach house': 'beach-houses',
};

/**
 * Portuguese needs the right article per place name — "na Costa do Sol" but
 * "no Bairro Triunfo" and "em Maputo". A template cannot guess this, so each
 * place carries its own.
 *
 * Carried over from the preview with its caveat intact: these need a native
 * speaker to confirm. Unknown names fall back to "em", which is the safest of
 * the three and is why an unlisted bairro still reads acceptably.
 */
const ARTICLE_PT: Record<string, string> = {
  'Costa do Sol': 'na', Polana: 'na', Sommerschield: 'em', Malhangalene: 'em',
  Triunfo: 'no', 'Bairro Triunfo': 'no', Fomento: 'no', Praia: 'na',
  Centro: 'no', Central: 'no', Katembe: 'na', 'Ponta do Ouro': 'na',
  Maputo: 'em', Matola: 'na', Beira: 'na', Nampula: 'em',
  Pemba: 'em', Inhambane: 'em', Vilanculos: 'em', 'Xai-Xai': 'em', Tofo: 'no',
};

const artPt = (place: string) => ARTICLE_PT[place] || 'em';

/** 1 -> "1st". Used for an apartment's floor in the English copy. */
const ordinalEn = (n: number) => {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
};

/**
 * Condition, phrased so Portuguese needs no gender agreement.
 *
 * "renovada" vs "renovado" would have to be threaded through every category;
 * "passou por obras de renovação recentes" is true of a moradia and an
 * apartamento alike and reads better than either.
 */
const CONDITION_EN: Record<Exclude<CategoryAnswers['condition'], ''>, string> = {
  new: 'is newly built',
  renovated: 'has recently been renovated',
  good: 'is in good condition',
  'needs work': 'needs work',
};

const CONDITION_PT: Record<Exclude<CategoryAnswers['condition'], ''>, string> = {
  new: 'é uma construção nova',
  renovated: 'passou por obras de renovação recentes',
  good: 'está em bom estado',
  'needs work': 'precisa de obras',
};

/** Amenities are translated too, or the sentence reads "Inclui pool, furnished". */
export const AMENITY_LABEL_PT: Record<string, string> = {
  Pool: 'piscina',
  Garden: 'jardim',
  Furnished: 'mobilada',
  '24/7 security': 'segurança 24 horas',
  'Backup generator': 'gerador de reserva',
  'Borehole / water tank': 'furo de água',
  'Air conditioning': 'ar condicionado',
  'Sea view': 'vista para o mar',
  'Ensuite bedroom': 'suíte',
  'Staff quarters': 'quarto de empregada',
  Solar: 'energia solar',
  'Fibre internet': 'internet por fibra',
  'DUAT in order': 'DUAT regularizado',
  'Outdoor kitchen': 'cozinha exterior',
  'Store room': 'arrecadação',
  'Additional bathroom': 'casa de banho adicional',
  'Semi-furnished': 'semimobilada',
  'Direct beach access': 'acesso directo à praia',
  Lift: 'elevador',
  'Walled / fenced': 'vedado com muro',
  'Corner plot': 'talhão de esquina',
  'Not flood-prone': 'sem risco de inundação',
  'Water at the boundary': 'água na berma',
  'Electricity at the boundary': 'electricidade na berma',
};

/**
 * The Portuguese noun for each type, lower-case for mid-sentence use, with its
 * gender.
 *
 * PT_TYPE above is for labels — "Moradia" at the head of a table cell. Prose
 * needs the noun inside a sentence AND needs to agree with it: "nesta moradia
 * mobilada" but "neste apartamento mobilado". Getting that wrong is the single
 * most obvious tell that Portuguese was generated by a template written in
 * English, so the gender is carried as data rather than guessed from the ending
 * (which would get "espaço comercial" and "casa de praia" wrong).
 */
const PT_NOUN: Record<string, { noun: string; f: boolean }> = {
  House: { noun: 'moradia', f: true },
  Apartment: { noun: 'apartamento', f: false },
  Land: { noun: 'terreno', f: false },
  Commercial: { noun: 'espaço comercial', f: false },
  'Beach house': { noun: 'casa de praia', f: true },
  Villa: { noun: 'vivenda', f: true },
  Penthouse: { noun: 'cobertura', f: true },
  Studio: { noun: 'estúdio', f: false },
  Bungalow: { noun: 'bungalow', f: false },
  Lodge: { noun: 'lodge', f: false },
};

/**
 * The one feature that earns a place in the opening sentence.
 *
 * A listing leads with its best thing. In priority order, because a property
 * with a sea view leads on the sea view even if it also has a pool. Everything
 * not chosen here still appears in the bulleted sections below — this is
 * "lead with the best, list the rest", not a second copy of the feature list.
 */
const HEADLINE_FEATURE: Array<[string, string, string]> = [
  // [answer, PT clause, EN clause]
  ['Sea view', 'com vista para o mar', 'with a sea view'],
  ['Pool', 'com piscina', 'with a pool'],
  ['Garden', 'com jardim', 'with a garden'],
  ['Solar', 'com energia solar', 'with solar power'],
  ['Backup generator', 'com gerador de reserva', 'with a backup generator'],
];

/**
 * A small stable hash, used to vary the phrasing between listings.
 *
 * The problem it solves: with one fixed opening sentence, two different houses
 * in the same bairro came out 88% word-identical, and half of every
 * description was text that appeared verbatim on other listings. That reads as
 * a template to a buyer and counts as duplicate content to a search engine.
 *
 * Seeded off the listing's own slug, so it is still a pure function of the
 * answers — the same property always produces the same page, which is the
 * whole promise of this module — while two different properties get different
 * sentences. This is variation, not randomness: there is no Math.random() here
 * and there must never be, or the preview would disagree with what is saved.
 */
const hash = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

const pick = <T,>(options: readonly T[], seed: string): T => options[hash(seed) % options.length];

/** The few amenity names that need an article when they appear mid-sentence. */
const EN_ARTICLE: Record<string, string> = {
  'Sea view': 'a sea view',
  Pool: 'a pool',
  Garden: 'a garden',
  'Backup generator': 'a backup generator',
  'Store room': 'a store room',
  'Additional bathroom': 'an additional bathroom',
  Lift: 'a lift',
};

/** Capitalises a verb only when it is starting the sentence itself. */
const capFirst2 = (subject: string, verb: string) =>
  subject ? verb : verb[0].toUpperCase() + verb.slice(1);

/** "a, b e c" — the Portuguese list separator, and its English twin. */
const joinList = (items: string[], and: string) =>
  items.length <= 1
    ? items[0] ?? ''
    : `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;

const deaccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export const slugify = (s: string) =>
  deaccent(String(s)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const mznFmt = (n: number) => new Intl.NumberFormat('en-US').format(n);

/**
 * The lead clause starts with the property type when no bedroom count has been
 * entered yet, and "house for sale in Maputo." is not a sentence. Only the
 * first character is touched — "m²" and place names keep their own casing.
 */
const sentenceCase = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);

/** Section bodies start with an amenity name, which is stored lower-case. */
const capFirst = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);

export interface GeneratedListing {
  slug: string;
  url: string;
  /** The H1 and the stored Property.title, in English. */
  title: string;
  /**
   * The same H1 in Portuguese, stored as Property.titlePt.
   *
   * The site opens in Portuguese, so before this the default visitor met an
   * English headline sitting on top of a Portuguese body — on the listing
   * page, on every card and in the home hero. The body had already been
   * written in both languages; the headline above it had not.
   */
  titlePt: string;
  /** The <title> tag, suffixed with the site name. */
  titleFull: string;
  /** The same <title> tag built from the Portuguese headline. */
  titleFullPt: string;
  /** The meta description in English, stored as Property.metaEn. */
  meta: string;
  /** The meta description in Portuguese, stored as Property.metaPt. */
  metaPt: string;
  /** The listing body, in Portuguese, assembled from the answers. */
  ptDesc: string;
  /** The same body in English. Both are stored; the page shows one. */
  enDesc: string;
  ptSlug: string;
  parent: string;
  jsonld: Record<string, unknown>;
  score: number;
  band: 'good' | 'warn' | 'crit';
  forWord: string;
  isLand: boolean;
  /** Answers still missing, in the agent's words, for the quality hint. */
  missing: string[];
}

/** Bands follow the preview: >= 85 good, >= 60 warn, below that critical. */
export function qualityBand(score: number): 'good' | 'warn' | 'crit' {
  return score >= 85 ? 'good' : score >= 60 ? 'warn' : 'crit';
}

export function generateListing(a: ListingAnswers): GeneratedListing {
  const isLand = a.propertyType === 'Land';
  const forWord = a.listingType === 'sale' ? 'Sale' : a.listingType === 'rent' ? 'Rent' : 'Short Stay';
  const forSlug = a.listingType === 'sale' ? 'for-sale' : a.listingType === 'rent' ? 'for-rent' : 'short-stay';
  const ptFor = a.listingType === 'sale' ? 'à venda' : a.listingType === 'rent' ? 'para arrendar' : 'para férias';
  const ptForSlug = a.listingType === 'sale' ? 'a-venda' : a.listingType === 'rent' ? 'para-arrendar' : 'ferias';

  const near = a.near.map((n) => n.trim().replace(/[.,;:]+$/, '')).filter(Boolean);
  const bairro = a.bairro.trim();

  /*
   * Chips belonging to another category are dropped here, not carried.
   *
   * The wizard no longer offers a plot a swimming pool, but an agent who
   * ticked Pool on a house and then switched the type to Land would otherwise
   * keep it in `features` — and it would reach the bullets, the amenity
   * filters and the meta description.
   */
  const feats = featuresInScope(a);

  /*
   * Every clause below is omitted when its answer is missing, rather than
   * rendered with a zero or an empty slot. The panel updates live from the
   * first keystroke, so a naive template greets the agent with
   * "0 Bedroom House for Sale in , Maputo" before they have typed anything —
   * which reads as a bug in the product, not as a prompt to keep going.
   */
  const placeEn = [bairro, a.city].filter(Boolean).join(', ');
  const inPlaceEn = placeEn ? ` in ${placeEn}` : '';
  /*
   * The prose place clause used to be built here as "na Costa do Sol, em
   * Maputo" — an article on the bairro AND one on the city. For a place in the
   * table that is correct; for anything outside it both fell back to "em" and
   * the sentence came out "em Zimpeto, em Maputo", the same preposition twice
   * in one clause. The description now uses the headline form built below —
   * article on the bairro, city bare after a comma — which is both shorter and
   * always grammatical, whether or not the bairro is one this file knows.
   */

  // Descriptive, stable, never the raw id.
  const slug = isLand
    ? slugify(['land', forSlug, bairro, a.city, a.landSize ? `${a.landSize}sqm` : ''].filter(Boolean).join(' '))
    : slugify([a.beds ? `${a.beds} bedroom` : '', a.propertyType, forSlug, bairro, a.city].filter(Boolean).join(' '));
  /* `/properties/`, with the s — the path the site actually serves. This said
     `/property/` while the route was `/properties/[id]`, so the preview under
     "What search engines will see" showed the agent a URL that did not exist.
     It is now the real address, and the slug below is the one stored on the
     row. */
  const url = `houseinmozambique.com/properties/${slug}`;

  const ptType = PT_TYPE[a.propertyType] || a.propertyType;

  /*
   * A headline takes a shorter place clause than a sentence does.
   *
   * The description opens "na Costa do Sol, em Maputo" because it is prose and
   * the second preposition carries it. Repeating that in an H1 gives
   * "Moradia T3 à venda na Costa do Sol, em Maputo" — correct, but longer than
   * the English twin and past the 60 characters a title tag gets to show. The
   * bairro keeps its article, the city follows it bare, exactly as the English
   * "in Costa do Sol, Maputo" does.
   */
  const ptPlaceTitle = bairro
    ? ` ${artPt(bairro)} ${bairro}${a.city ? `, ${a.city}` : ''}`
    : a.city
      ? ` ${artPt(a.city)} ${a.city}`
      : '';

  /* Types are stored sentence-case ("Beach house"); an English headline is
   * title-case around it, and "Beach house for Short Stay" shows the seam. */
  const typeTitleEn = a.propertyType.replace(/(^|\s)(\p{Ll})/gu, (_m, sp, c) => sp + c.toUpperCase());

  const title = isLand
    ? `${a.landSize ? `${a.landSize} m² ` : ''}Land for ${forWord}${inPlaceEn}`
    : `${a.beds ? `${a.beds} Bedroom ` : ''}${typeTitleEn} for ${forWord}${inPlaceEn}`;
  const titleFull = `${title} | House in Mozambique`;

  /*
   * "T3" rather than "3 quartos": the Lusophone convention for typology, and
   * what a Mozambican buyer scans a results page for. Land has no typology,
   * so it leads on the plot size the way the English title does.
   */
  const titlePt = isLand
    ? `Terreno${a.landSize ? ` de ${a.landSize} m²` : ''} ${ptFor}${ptPlaceTitle}`
    : `${ptType}${a.beds ? ` T${a.beds}` : ''} ${ptFor}${ptPlaceTitle}`;
  const titleFullPt = `${titlePt} | House in Mozambique`;

  const topFeat = feats.slice(0, 2).map((f) => f.toLowerCase()).join(' and ');
  const metaFacts = isLand
    ? [a.price ? `${mznFmt(a.price)} ${a.currency}` : '']
    : [
        a.buildingSize ? `${a.buildingSize} m²` : '',
        a.baths ? `${a.baths} ${a.baths === 1 ? 'bathroom' : 'bathrooms'}` : '',
        topFeat,
      ];
  const metaLead = isLand
    ? `${a.landSize ? `${a.landSize} m² ` : ''}plot for ${forWord.toLowerCase()}${inPlaceEn}`
    : `${a.beds ? `${a.beds}-bedroom ` : ''}${a.propertyType.toLowerCase()} for ${forWord.toLowerCase()}${inPlaceEn}`;
  const facts = metaFacts.filter(Boolean).join(', ');
  const meta = sentenceCase(
    [
      `${metaLead}.`,
      facts ? `${facts}.` : '',
      isLand ? 'View photos, exact location and contact the agent.' : 'View photos, price and location.',
    ].filter(Boolean).join(' ').replace(/\s+/g, ' '),
  );

  /*
   * The Portuguese meta description, composed rather than translated.
   *
   * It matters more than the English one: the site opens in Portuguese, so
   * this is what the default search result shows. Note "casa de banho" takes
   * its plural on both words — a template that appends an "s" produces
   * "2 casa de banhos", which is the kind of detail that tells a reader the
   * page was generated.
   */
  const topFeatPt = feats
    .slice(0, 2)
    .map((f) => AMENITY_LABEL_PT[f] || f.toLowerCase())
    .join(' e ');
  const ptBaths = a.baths ? `${a.baths} ${a.baths === 1 ? 'casa de banho' : 'casas de banho'}` : '';
  const metaLeadPt = isLand
    ? `Terreno${a.landSize ? ` de ${a.landSize} m²` : ''} ${ptFor}${ptPlaceTitle}`
    : `${ptType}${a.beds ? ` T${a.beds}` : ''} ${ptFor}${ptPlaceTitle}`;
  const factsPt = (isLand
    ? [a.price ? `${mznFmt(a.price)} ${a.currency}` : '']
    : [a.buildingSize ? `${a.buildingSize} m²` : '', ptBaths, topFeatPt]
  ).filter(Boolean).join(', ');
  const metaPt = sentenceCase(
    [
      `${metaLeadPt}.`,
      factsPt ? `${factsPt}.` : '',
      isLand ? 'Veja fotos, localização exacta e contacte o agente.' : 'Veja fotos, preço e localização.',
    ].filter(Boolean).join(' ').replace(/\s+/g, ' '),
  );

  /*
   * The description, shaped the way the listings that sell on this market are
   * written — the House in Rwanda pages being the reference. One opening line,
   * headed sections of bullets, a closing line about who the property suits.
   *
   * WHAT IT DELIBERATELY DOES NOT CONTAIN:
   *
   *   · The room counts and areas. Those are the Specification table's job on
   *     the property page, and bulleting "23 quartos / 10 casas de banho /
   *     123 m²" three lines above a table that says Bedrooms 23, Bathrooms 10,
   *     Internal area 123 m² makes the page read like it is padding itself.
   *     Each fact belongs in exactly one place.
   *   · The price, which is already a field and goes stale in prose.
   *   · The contact details, which are buttons, and a number typed into a
   *     paragraph cannot be counted.
   *
   * Both languages are built here from the same answers rather than one being
   * translated later. A Portuguese page with English headings in the middle of
   * it is the clearest tell that a listing was machine-made.
   */
  const inGroupPt = (key: string) =>
    (FEATURE_GROUPS.find((g) => g.key === key)?.items ?? [])
      .filter((f) => feats.includes(f))
      .map((f) => AMENITY_LABEL_PT[f] || f.toLowerCase());

  const inGroupEn = (key: string) =>
    (FEATURE_GROUPS.find((g) => g.key === key)?.items ?? [])
      .filter((f) => feats.includes(f));


  /*
   * THE LEAD SENTENCE.
   *
   * The reference this module is written against reads:
   *
   *   "Discover comfort, convenience, and excellent investment potential with
   *    this beautifully furnished 4-bedroom house located in the peaceful and
   *    well-established neighborhood of Gisozi, Kigali."
   *
   * What made the old version flat was not the vocabulary but the grammar. It
   * had split that one idea into two dead noun phrases —
   *
   *   "Moradia T3 de 220 m² à venda na Costa do Sol, em Maputo."
   *   "Conforto, conveniência e um bom potencial de investimento nesta
   *    propriedade na Costa do Sol, em Maputo."
   *
   * — which names the place twice, opens on a label rather than a verb, and
   * calls the property "propriedade" when the answers already say it is a
   * three-bedroom house. One sentence, led by a verb, with the facts woven in
   * as modifiers, carries the same information and reads like a person wrote it.
   *
   * NOTHING HERE IS INVENTED. Every adjective is earned by an answer:
   * "mobilada" only if Furnished was ticked, "com piscina" only if Pool was.
   * The reference's "quality finishes" and "peaceful and well-established
   * neighborhood" are deliberately NOT reproduced — no question on the form
   * asks about either, and a generated listing that claims them is one that lies.
   */
  const noun = PT_NOUN[a.propertyType]
    ?? { noun: (PT_TYPE[a.propertyType] ?? a.propertyType).toLowerCase(), f: false };
  /* Was a chip; now a three-way answer, so the lead can say "semimobilado"
   * instead of having to choose between "mobilado" and silence. */
  const ptFurn = a.furnishing === 'full' ? (noun.f ? ' mobilada' : ' mobilado')
    : a.furnishing === 'semi' ? (noun.f ? ' semimobilada' : ' semimobilado')
    : '';
  const enFurn = a.furnishing === 'full' ? ' beautifully furnished'
    : a.furnishing === 'semi' ? ' semi-furnished'
    : '';
  const ptPlace = ptPlaceTitle.trim();

  const ptVerb = pick(['Descubra', 'Conheça', 'Encontre'] as const, slug);
  const enVerb = pick(['Discover', 'Explore', 'Find'] as const, slug);

  /* The pitch follows the intent. A tenant is not buying an investment, and
   * telling them about "potencial de investimento" addresses the wrong person —
   * the old copy said it on every listing, including the rentals. */
  const isCommercial = a.propertyType === 'Commercial';
  const ptBenefit = isCommercial
    ? 'um espaço bem localizado e com bom potencial de rendimento'
    : a.listingType === 'sale' ? 'conforto, conveniência e um excelente potencial de investimento'
    : a.listingType === 'rent' ? 'conforto, conveniência e uma localização privilegiada'
    : 'conforto, tranquilidade e uma estadia bem localizada';
  const enBenefit = isCommercial
    ? 'a well-located space with solid income potential'
    : a.listingType === 'sale' ? 'comfort, convenience and excellent investment potential'
    : a.listingType === 'rent' ? 'comfort, convenience and an excellent location'
    : 'comfort, calm and a well-placed stay';

  const star = HEADLINE_FEATURE.find(([f]) => feats.includes(f));
  const ptStar = star ? ` ${star[1]}` : '';
  const enStar = star ? ` ${star[2]}` : '';

  const ptWhere = ptPlace ? `, ${ptPlace}` : '';
  const enWhere = placeEn ? `, in ${placeEn}` : '';

  /*
   * FOUR SENTENCE SHAPES, not one sentence with four openings.
   *
   * Swapping "Descubra" for "Conheça" changes three characters and leaves the
   * grammar identical, so a page of results still reads as one template with
   * the serial numbers filed off. What actually varies a listing is where the
   * sentence STARTS — on the invitation, on the place, on the property itself,
   * or on the reader's intent — because that changes the rhythm of the whole
   * line.
   *
   * The shape is drawn on a different seed from the verb, so the two do not
   * move together: three verbs across four shapes is twelve distinct openings
   * per intent, all from the same answers and all still deterministic.
   */
  const ptNounPhrase = `${noun.noun}${a.beds ? ` T${a.beds}` : ''}${ptFurn}${a.buildingSize ? ` de ${a.buildingSize} m²` : ''}`;
  const enNounPhrase = `${enFurn ? `${enFurn.trim()} ` : ''}${a.beds ? `${a.beds}-bedroom ` : ''}${a.propertyType.toLowerCase()}${a.buildingSize ? ` of ${a.buildingSize} m²` : ''}`;
  const ptPlotPhrase = `terreno${a.landSize ? ` de ${a.landSize} m²` : ''}`;
  const enPlotPhrase = `${a.landSize ? `${a.landSize} m² ` : ''}plot`;

  const shape = hash(`${slug}shape`) % 4;
  const ptSeek = a.listingType === 'rent' ? 'arrendar' : a.listingType === 'short stay' ? 'uma estadia' : 'comprar';
  const enSeek = a.listingType === 'rent' ? 'rent' : a.listingType === 'short stay' ? 'stay' : 'buy';
  const ptIndef = noun.f ? 'uma' : 'um';
  const ptDem = noun.f ? 'nesta' : 'neste';
  // "Na Costa do Sol, Maputo" — the place clause promoted to the front, which
  // needs its preposition capitalised.
  const ptPlaceFront = ptPlace ? capFirst(ptPlace) : '';

  const ptLead = isLand
    ? [
        `${ptVerb} uma excelente oportunidade de investimento neste ${ptPlotPhrase}${ptWhere}.`,
        ptPlaceFront ? `${ptPlaceFront}, um ${ptPlotPhrase}.` : `Um ${ptPlotPhrase}.`,
        `${capFirst(ptPlotPhrase)}${ptWhere} — uma oportunidade para quem procura investir ou construir.`,
        `Para quem procura ${ptSeek}${ptPlace ? ` ${ptPlace}` : ''}: um ${ptPlotPhrase}.`,
      ][shape]
    : [
        `${ptVerb} ${ptBenefit} ${ptDem} ${ptNounPhrase}${ptStar}${ptWhere}.`,
        ptPlaceFront ? `${ptPlaceFront}, ${ptIndef} ${ptNounPhrase}${ptStar}.` : `${capFirst(ptNounPhrase)}${ptStar}.`,
        `${capFirst(ptNounPhrase)}${ptWhere}${ptStar ? `,${ptStar}` : ''} — ${ptBenefit}.`,
        `Se procura ${ptBenefit.replace(/^conforto, /, '')}${ptPlace ? ` ${ptPlace}` : ''}, ${ptIndef === 'uma' ? 'esta' : 'este'} ${ptNounPhrase}${ptStar} merece uma visita.`,
      ][shape];

  const enPlaceFront = placeEn ? `In ${placeEn}` : '';
  const enLead = isLand
    ? [
        `${enVerb} a solid investment opportunity in this ${enPlotPhrase}${enWhere}.`,
        enPlaceFront ? `${enPlaceFront}, a ${enPlotPhrase}.` : `A ${enPlotPhrase}.`,
        `${capFirst(enPlotPhrase)}${enWhere} — one for anyone looking to invest or to build.`,
        `For anyone looking to ${enSeek}${placeEn ? ` in ${placeEn}` : ''}: a ${enPlotPhrase}.`,
      ][shape]
    : [
        `${enVerb} ${enBenefit} in this ${enNounPhrase}${enStar}${enWhere}.`,
        enPlaceFront ? `${enPlaceFront}, a ${enNounPhrase}${enStar}.` : `${capFirst(enNounPhrase)}${enStar}.`,
        `${capFirst(enNounPhrase)}${enWhere}${enStar ? `,${enStar}` : ''} — ${enBenefit}.`,
        `If you are looking for ${enBenefit}${placeEn ? ` in ${placeEn}` : ''}, this ${enNounPhrase}${enStar} is worth a viewing.`,
      ][shape];

  /*
   * THE CATEGORY SENTENCE — the paragraph that finally makes a plot listing
   * read differently from a flat listing.
   *
   * Everything in it comes from a question only this category is asked, so it
   * is empty for a category that answered none of them and the paragraph drops
   * out rather than padding. Clauses are assembled as a list and joined, which
   * is what lets a half-filled form still produce a grammatical sentence.
   */
  const ptBits: string[] = [];
  const enBits: string[] = [];

  if (isLand) {
    if (a.frontage > 0 && a.depth > 0) {
      ptBits.push(`mede ${a.frontage} m de frente por ${a.depth} m de profundidade`);
      enBits.push(`measures ${a.frontage} m across the front by ${a.depth} m deep`);
    }
    /*
     * Zoning, DUAT and road all take the verb "ter", so pushing them as three
     * separate clauses produced "tem uso residencial, tem DUAT regularizado,
     * tem acesso por estrada alcatroada". They share one verb instead, and the
     * negative DUAT — which cannot join a "tem" list — stands on its own.
     */
    const ptHas: string[] = [];
    const enHas: string[] = [];
    if (a.zoning) {
      ptHas.push(`uso ${CATEGORY_LABEL_PT.zoning[a.zoning]}`);
      enHas.push(`is zoned ${CATEGORY_LABEL_EN.zoning[a.zoning]}`);
    }
    // Only a DUAT the plot actually holds belongs in a "tem" list; the other
     // two states are conditions, not possessions.
     if (a.duat === 'in order' || a.duat === 'in progress') {
      ptHas.push(CATEGORY_LABEL_PT.duat[a.duat]);
      enHas.push(`has its ${CATEGORY_LABEL_EN.duat[a.duat]}`);
    }
    if (a.roadSurface) {
      ptHas.push(`acesso por ${CATEGORY_LABEL_PT.roadSurface[a.roadSurface]}`);
      enHas.push(`is reached by ${CATEGORY_LABEL_EN.roadSurface[a.roadSurface]}`);
    }
    if (ptHas.length) ptBits.push(`tem ${joinList(ptHas, 'e')}`);
    enBits.push(...enHas);
    if (a.duat === 'none') {
      ptBits.push('ainda não tem DUAT');
      enBits.push('does not yet have a DUAT');
    }
    if (a.duat === 'unknown') {
      ptBits.push('tem o DUAT por confirmar');
      enBits.push('has a DUAT that is not yet confirmed');
    }
  } else {
    if (a.storeys >= 2) {
      ptBits.push(`desenvolve-se em ${a.storeys} pisos`);
      enBits.push(`is set over ${a.storeys} floors`);
    }
    if (a.propertyType === 'Apartment' && a.floor >= 0) {
      ptBits.push(a.floor === 0 ? 'fica no rés-do-chão' : `fica no ${a.floor}.º andar`);
      enBits.push(a.floor === 0 ? 'is on the ground floor' : `is on the ${ordinalEn(a.floor)} floor`);
    }
    if (a.suites > 0) {
      ptBits.push(`tem ${a.suites} ${a.suites === 1 ? 'suíte' : 'suítes'}`);
      enBits.push(`has ${a.suites} ${a.suites === 1 ? 'en-suite bedroom' : 'en-suite bedrooms'}`);
    }
    if (a.propertyType === 'Commercial' && a.commercialUse) {
      ptBits.push(`está preparado para ${CATEGORY_LABEL_PT.commercialUse[a.commercialUse]}`);
      enBits.push(`is set up for ${CATEGORY_LABEL_EN.commercialUse[a.commercialUse]}`);
    }
    if (a.condition) {
      // Phrased to avoid gender agreement entirely — "passou por obras" works
      // for a moradia and an apartamento alike, where "renovada/renovado"
      // would need the noun's gender threaded through every branch.
      ptBits.push(CONDITION_PT[a.condition]);
      // CATEGORY_LABEL_EN.condition holds bare adjective phrases for use as
      // labels; a clause in a verb list needs the copula, or it reads
      // "…has 2 en-suite bedrooms and recently renovated".
      enBits.push(CONDITION_EN[a.condition]);
    }
  }

  /* What is standing on the plot is a fact of its own, not a trailing clause:
   * "…tem acesso por estrada alcatroada e com uma ruína" is not Portuguese. */
  const ptStanding = isLand && a.structures && a.structures !== 'none'
    ? ` No terreno existe ${a.structures === 'ruin' ? 'uma ruína'
        : a.structures === 'foundation' ? 'uma fundação já feita'
        : 'uma construção por acabar'}.`
    : '';
  const enStanding = isLand && a.structures && a.structures !== 'none'
    ? ` There ${a.structures === 'ruin' ? 'is a ruin'
        : a.structures === 'foundation' ? 'are foundations already laid'
        : 'is an unfinished building'} on it.`
    : '';

  const ptSubject2 = `${noun.f ? 'A' : 'O'} ${noun.noun}`;
  const enSubject2 = isLand ? 'The plot' : `The ${a.propertyType.toLowerCase()}`;
  const ptDetail = ptBits.length ? `${ptSubject2} ${joinList(ptBits, 'e')}.${ptStanding}` : ptStanding.trim();
  const enDetail = enBits.length ? `${enSubject2} ${joinList(enBits, 'and')}.${enStanding}` : enStanding.trim();

  /*
   * THE SECOND PARAGRAPH: the space, then what is around it.
   *
   * The landmarks used to be a bulleted list under a "Localização
   * privilegiada" heading. They read better flowed into a sentence, which is
   * what the reference does with them, and it means the place is carried by
   * prose instead of appearing a third time as a heading.
   *
   * It speaks in categories — "espaços interiores e exteriores" — and leaves
   * the specifics to the bulleted sections below, so no feature is claimed
   * twice. "Amplos" has to be earned by a real number rather than by wishing.
   */
  // A plot has no rooms, so it never claims indoor space — not even if the
  // agent ticked an indoor feature by mistake. Its area is already in the lead
  // sentence, which leaves this paragraph to say only what is nearby.
  /*
   * A recorded building area is itself evidence of indoor space — the chips
   * only say what is IN it. And a sea view is not outdoor space: a third-floor
   * flat with a view and no balcony was claiming "espaços exteriores".
   */
  const hasIndoor = !isLand && (a.buildingSize > 0 || inGroupEn('indoor').length > 0);
  const OUTDOOR_SPACE = ['Pool', 'Garden', 'Direct beach access'];
  const hasOutdoor = !isLand
    && (a.landSize > 0 || inGroupEn('outdoor').some((f) => OUTDOOR_SPACE.includes(f)));
  // 500 m² of plot, or a plot at least twice the footprint, is genuinely roomy
  // here; below that "amplos" is a claim the answers do not support.
  const roomy = a.landSize >= 500 || (a.landSize > 0 && a.buildingSize > 0 && a.landSize >= a.buildingSize * 2);

  const ptSpaces = hasIndoor && hasOutdoor
    ? `${roomy ? 'amplos espaços' : 'espaços'} interiores e exteriores`
    : hasOutdoor ? (roomy ? 'um amplo espaço exterior' : 'espaço exterior')
    : hasIndoor ? 'espaços interiores bem equipados'
    : '';
  const enSpaces = hasIndoor && hasOutdoor
    ? `${roomy ? 'generous ' : ''}indoor and outdoor spaces`
    : hasOutdoor ? `${roomy ? 'generous ' : ''}outdoor space`
    : hasIndoor ? 'well-equipped indoor spaces'
    : '';

  const ptNear = near.length ? `perto de ${joinList(near, 'e')}` : '';
  const enNear = near.length ? `close to ${joinList(near, 'and')}` : '';

  const ptSubject = isLand ? 'O terreno' : 'A propriedade';
  const enSubject = isLand ? 'The plot' : 'The property';

  /*
   * When the category sentence ran first, this one repeated its subject — "A
   * moradia desenvolve-se em 2 pisos…" immediately followed by "A propriedade
   * oferece…". Portuguese drops the subject freely, so it does; English takes
   * "It".
   */
  const ptSubj = ptDetail ? '' : `${ptSubject} `;
  const enSubj = ptDetail ? 'It ' : `${enSubject} `;
  const ptOffers =
    ptSpaces && ptNear ? `${ptSubj}${capFirst2(ptSubj, 'oferece')} ${ptSpaces} e fica ${ptNear}.`
    : ptSpaces ? `${ptSubj}${capFirst2(ptSubj, 'oferece')} ${ptSpaces}.`
    : ptNear ? `${ptSubj}${capFirst2(ptSubj, 'fica')} ${ptNear}.`
    : '';
  const enOffers =
    enSpaces && enNear ? `${enSubj}offers ${enSpaces} and sits ${enNear}.`
    : enSpaces ? `${enSubj}offers ${enSpaces}.`
    : enNear ? `${enSubj}sits ${enNear}.`
    : '';

  /*
   * THE FEATURES, AS PROSE — and why they are no longer a bulleted list.
   *
   * The property page already renders `amenities` as a checkmarked card under
   * "What this place offers". The description used to bullet the SAME array
   * directly above it, so a plot listing showed Sea view, 24/7 security,
   * Walled / fenced, Not flood-prone, Water at the boundary and Electricity at
   * the boundary twice on one screen, in two different visual styles, with no
   * fact added the second time.
   *
   * The card is the scannable copy — it has the checkmarks and it is what a
   * buyer's eye goes to. So the description stops competing with it and does
   * the thing a card cannot: reads like a sentence. This also removes the
   * strongest visual tell that the text was generated, because nothing says
   * "filled in by a form" like four headed bullet lists in a row.
   */
  const anyOf = (...keys: string[]) => keys.flatMap((k) => inGroupEn(k));

  const insidePt = isLand ? [] : inGroupPt('indoor');
  const outsidePt = isLand ? [] : inGroupPt('outdoor');
  const insideEn = isLand ? [] : inGroupEn('indoor');
  const outsideEn = isLand ? [] : inGroupEn('outdoor').map((f) => EN_ARTICLE[f] ?? f.toLowerCase());

  /*
   * The plot chips do not fit a "comes with" list — they are predicates.
   *
   * "Conta ainda com vedado com muro" is not Portuguese. Each one carries the
   * verb it belongs to instead: things the plot IS (está vedado), things it
   * HAS (água, electricidade), and clauses that stand alone (não tem risco de
   * inundação).
   */
  const plotIsPt: string[] = [];
  const plotIsEn: string[] = [];
  const plotHasPt: string[] = [];
  const plotHasEn: string[] = [];
  const plotClausePt: string[] = [];
  const plotClauseEn: string[] = [];

  if (feats.includes('Walled / fenced')) {
    plotIsPt.push('vedado com muro');
    plotIsEn.push('walled and fenced');
  }
  if (feats.includes('Corner plot')) {
    plotClausePt.push('É um talhão de esquina.');
    plotClauseEn.push('It is a corner plot.');
  }
  if (feats.includes('Not flood-prone')) {
    plotClausePt.push('Não tem risco de inundação.');
    plotClauseEn.push('It is not flood-prone.');
  }
  /* A plot's outdoor answers — a sea view, beach access — are things it has,
   * so they join the "tem" list rather than being announced under a heading
   * the plot does not have ("No exterior, vista para o mar."). */
  if (isLand) {
    plotHasPt.push(...inGroupPt('outdoor'));
    // "with sea view" is not English; a handful of these need their article.
    plotHasEn.push(...inGroupEn('outdoor').map((f) => EN_ARTICLE[f] ?? f.toLowerCase()));
  }

  // Paired so the shared "na berma" is said once, not once per utility.
  /*
   * The utilities take a sentence of their own rather than joining the list.
   *
   * "água e electricidade na berma" already contains an "e", so appending it
   * to a list joined with "e" produced "com vista para o mar e água e
   * electricidade na berma" — two conjunctions in one breath.
   */
  const water = feats.includes('Water at the boundary');
  const power = feats.includes('Electricity at the boundary');
  const utilPt = water && power ? 'água e electricidade na berma'
    : water ? 'água na berma'
    : power ? 'electricidade na berma'
    : '';
  const utilEn = water && power ? 'water and electricity at the boundary'
    : water ? 'water at the boundary'
    : power ? 'electricity at the boundary'
    : '';
  if (utilPt) plotClausePt.unshift(`Tem ${utilPt}.`);
  if (utilEn) plotClauseEn.unshift(`It has ${utilEn}.`);

  const plotSubjPt = isLand ? 'O terreno' : capFirst(noun.noun) === noun.noun ? 'A propriedade' : 'A propriedade';
  const plotSentencePt = plotIsPt.length && plotHasPt.length
    ? `${isLand ? 'Está' : `${plotSubjPt} está`} ${joinList(plotIsPt, 'e')}, com ${joinList(plotHasPt, 'e')}.`
    : plotIsPt.length ? `${isLand ? 'Está' : `${plotSubjPt} está`} ${joinList(plotIsPt, 'e')}.`
    : plotHasPt.length ? `${isLand ? 'Tem' : `${plotSubjPt} tem`} ${joinList(plotHasPt, 'e')}.`
    : '';
  const plotSentenceEn = plotIsEn.length && plotHasEn.length
    ? `It is ${joinList(plotIsEn, 'and')}, with ${joinList(plotHasEn, 'and')}.`
    : plotIsEn.length ? `It is ${joinList(plotIsEn, 'and')}.`
    : plotHasEn.length ? `It has ${joinList(plotHasEn, 'and')}.`
    : '';

  // Inside and outside, as one appositive sentence rather than two headings.
  const insideOutPt = insidePt.length && outsidePt.length
    ? `No interior, ${joinList(insidePt, 'e')}; no exterior, ${joinList(outsidePt, 'e')}.`
    : insidePt.length ? `No interior, ${joinList(insidePt, 'e')}.`
    : outsidePt.length ? `No exterior, ${joinList(outsidePt, 'e')}.`
    : '';
  const insideOutEn = insideEn.length && outsideEn.length
    ? `Inside, ${joinList(insideEn.map((f) => f.toLowerCase()), 'and')}; outside, ${joinList(outsideEn, 'and')}.`
    : insideEn.length ? `Inside, ${joinList(insideEn.map((f) => f.toLowerCase()), 'and')}.`
    : outsideEn.length ? `Outside, ${joinList(outsideEn, 'and')}.`
    : '';

  // Everything that is genuinely a "comes with" list.
  const extrasPt = [...inGroupPt('services'), ...inGroupPt('annex'), ...inGroupPt('paperwork')];
  const extrasEn = anyOf('services', 'annex', 'paperwork').map((f) => EN_ARTICLE[f] ?? f.toLowerCase());
  const extrasLeadPt = pick(['Conta ainda com', 'Inclui', 'Dispõe de'] as const, `${slug}x`);
  const extrasLeadEn = pick(['It also comes with', 'It includes', 'It has'] as const, `${slug}x`);
  const extrasPtSentence = extrasPt.length ? `${extrasLeadPt} ${joinList(extrasPt, 'e')}.` : '';
  const extrasEnSentence = extrasEn.length ? `${extrasLeadEn} ${joinList(extrasEn, 'and')}.` : '';

  const ptFeatures = [insideOutPt, extrasPtSentence, plotSentencePt, ...plotClausePt]
    .filter(Boolean).join(' ');
  const enFeatures = [insideOutEn, extrasEnSentence, plotSentenceEn, ...plotClauseEn]
    .filter(Boolean).join(' ');

  /*
   * THE CLOSING: who it suits, and no location.
   *
   * The place was previously named in the opening, the intro AND this line.
   * Three times in a description this short is what made it read as filler.
   * It is in the lead sentence, in the H1 and in the address row already.
   */
  const ptClosing = isLand
    ? pick([
        'Ideal para investidores e para quem procura construir de raiz.',
        'Uma boa base para quem quer construir ou manter o terreno como investimento.',
      ] as const, slug)
    : a.listingType === 'rent'
      ? pick([
          'Ideal para famílias e profissionais que procuram arrendar um imóvel bem localizado.',
          'Uma boa opção para quem procura arrendar sem abdicar da localização.',
        ] as const, slug)
      : isCommercial
        ? pick([
            'Ideal para empresas e investidores que procuram um espaço bem localizado.',
            'Uma boa opção para quem precisa de espaço operacional com boa acessibilidade.',
          ] as const, slug)
      : a.listingType === 'short stay'
        ? pick([
            'Ideal para quem procura uma estadia confortável e bem localizada.',
            'Uma boa escolha para férias, viagens de trabalho ou estadias prolongadas.',
          ] as const, slug)
        : pick([
            'Ideal para famílias, investidores e expatriados à procura de um imóvel bem localizado.',
            'Uma oportunidade a considerar para quem procura comprar nesta zona.',
          ] as const, slug);

  const enClosing = isLand
    ? pick([
        'Well suited to investors and to anyone looking to build from scratch.',
        'A sound base for building, or for holding as an investment.',
      ] as const, slug)
    : a.listingType === 'rent'
      ? pick([
          'Well suited to families and professionals looking to rent somewhere well located.',
          'A good option for anyone who wants to rent without giving up on location.',
        ] as const, slug)
      : isCommercial
        ? pick([
            'Well suited to businesses and investors looking for a well-located space.',
            'A good option for anyone needing operational space with real accessibility.',
          ] as const, slug)
      : a.listingType === 'short stay'
        ? pick([
            'Well suited to anyone looking for a comfortable, well-placed stay.',
            'A good choice for holidays, work trips or longer stays.',
          ] as const, slug)
        : pick([
            'Well suited to families, investors and expatriates looking for a well-located property.',
            'One to consider for anyone looking to buy in this part of the city.',
          ] as const, slug);

  const assemble = (...paragraphs: string[]) =>
    paragraphs.map((x) => x.trim()).filter(Boolean).join('\n\n');

  /*
   * The closing line appears on roughly three listings in four.
   *
   * "Ideal para famílias, investidores e expatriados…" is the most
   * template-shaped sentence in the whole description — it says nothing the
   * rest has not, and on a results page every listing ending the same way is
   * what gives a portal away. Dropping it sometimes is the cheapest variation
   * available, and the listings that lose it do not read as unfinished.
   */
  const keepClosing = hash(`${slug}close`) % 4 !== 0;

  const ptBase = assemble(ptLead, ptDetail, ptFeatures, ptOffers, keepClosing ? ptClosing : '');
  const enBase = assemble(enLead, enDetail, enFeatures, enOffers, keepClosing ? enClosing : '');

  const ptSlug = isLand
    ? `/pt/terrenos-${ptForSlug}/${slugify(a.city)}/${slugify(bairro)}`
    : `/pt/${PT_TYPE_SLUG[a.propertyType] ?? slugify(a.propertyType)}-${ptForSlug}/${slugify(a.city)}/${slugify(bairro)}`;
  const parent = `/${EN_TYPE_SLUG[a.propertyType] ?? slugify(a.propertyType)}-${forSlug}/${slugify(a.city)}`;

  const jsonld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    url: 'https://' + url,
    ...(isLand
      ? {}
      : {
          numberOfBedrooms: a.beds,
          numberOfBathroomsTotal: a.baths,
          floorSize: { '@type': 'QuantitativeValue', value: a.buildingSize, unitCode: 'MTK' },
        }),
    ...(a.landSize ? { lotSize: { '@type': 'QuantitativeValue', value: a.landSize, unitCode: 'MTK' } } : {}),
    offers: {
      '@type': 'Offer',
      price: a.price,
      priceCurrency: a.currency,
      availability: 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: a.city,
      addressRegion: bairro,
      addressCountry: 'MZ',
    },
  };

  // Completeness, weighted as the preview weights it.
  const missing: string[] = [];
  let score = 0;
  if (a.city && bairro) score += 15;
  else missing.push('the bairro');

  // Commercial space is measured in m², not bedrooms. Scoring it on rooms it
  // is not expected to have capped every warehouse listing at 70.
  const sizeAnswered = isLand ? a.landSize > 0
    : isCommercial ? a.buildingSize > 0
    : Boolean(a.beds && a.baths && a.buildingSize);
  if (sizeAnswered) score += 20;
  else missing.push(isLand ? 'the plot size' : isCommercial ? 'the floor area' : 'rooms and size');

  if (a.price) score += 10;
  else missing.push('a price');

  if (feats.length >= 3) score += 15;
  else if (feats.length) score += 7;
  else missing.push('features');

  if (near.length >= 2) score += 10;
  else missing.push('nearby landmarks');

  // Not a blocker, but a plot listing that does not say what it may be built
  // on is missing the second thing a buyer asks.
  if (isLand && !a.zoning) missing.push('what the plot is zoned for');

  if (a.photos >= 6) score += 20;
  else {
    score += Math.round((a.photos / 6) * 20);
    missing.push('six photos');
  }

  // A plot has no interior. It was previously marked down for not providing
  // photographs of rooms it does not have, which capped every land listing.
  if (!REQUIRES_INTERIOR_SHOTS[a.propertyType as CategoryKey]) score += 10;
  else if (a.interior >= 2) score += 10;
  else missing.push('two interior shots');

  score = Math.min(100, score);

  return {
    slug, url, title, titlePt, titleFull, titleFullPt, meta, metaPt,
    ptDesc: ptBase,
    enDesc: enBase,
    ptSlug, parent, jsonld,
    score, band: qualityBand(score),
    forWord, isLand, missing,
  };
}

/**
 * A Portuguese headline for a listing that has no stored one.
 *
 * Everything the title is made of — type, intent, bedrooms, plot size, bairro,
 * city — is a column on Property, so a listing posted before `titlePt` existed
 * can still be given a Portuguese headline at render time instead of showing an
 * English one on a Portuguese page. It is a FALLBACK, not a replacement: the
 * stored `titlePt` always wins, which is what keeps a headline an agent or an
 * admin wrote by hand from being quietly regenerated underneath them.
 *
 * Returns '' when there is too little to work with, and the caller then falls
 * back to the stored English title — a real headline in the wrong language
 * beats a stub in the right one.
 */
export function listingTitlePt(p: {
  type?: string | null;
  listingType?: string | null;
  bedrooms?: number | null;
  area?: number | null;
  neighborhood?: string | null;
  city?: string | null;
}): string {
  const type = (p.type ?? '').trim();
  if (!type) return '';

  const land = /land|plot|terreno/i.test(type);
  // Stored as 'Buy' | 'Rent' | 'Short Stay'; matched loosely so an older row
  // spelled differently still lands on the right preposition.
  const intent = (p.listingType ?? '').trim();
  const ptFor = /rent|arrend/i.test(intent)
    ? 'para arrendar'
    : /short|stay|f[ée]rias/i.test(intent)
      ? 'para férias'
      : 'à venda';

  const bairro = (p.neighborhood ?? '').trim();
  const city = (p.city ?? '').trim();
  const place = bairro
    ? ` ${artPt(bairro)} ${bairro}${city ? `, ${city}` : ''}`
    : city
      ? ` ${artPt(city)} ${city}`
      : '';

  if (land) {
    const size = p.area && p.area > 0 ? ` de ${p.area} m²` : '';
    return `Terreno${size} ${ptFor}${place}`;
  }

  const ptType = PT_TYPE[type] || type;
  const beds = p.bedrooms && p.bedrooms > 0 ? ` T${p.bedrooms}` : '';
  return `${ptType}${beds} ${ptFor}${place}`;
}

/** The columns a headline can be built or chosen from. */
export interface TitleSource {
  title: string;
  titlePt?: string | null;
  type?: string | null;
  listingType?: string | null;
  bedrooms?: number | null;
  area?: number | null;
  neighborhood?: string | null;
  city?: string | null;
}

/**
 * The shape generateListing() gives an English headline.
 *
 * "for Sale" / "for Rent" / "for Short Stay", title-cased, is the signature —
 * no agent types that. It is the test for "this title was generated by the
 * wizard", and it has to be narrow, because the listings already in the
 * database were NOT generated: their titles were written by hand, in
 * Portuguese, and pasted out of WhatsApp —
 *
 *   BAIXOU! VENDE-SE MANSÃO TRIPLEX T4 - MAGOANINE CMC | PRÓXIMO À ROTUNDA
 *   🔑 OPORTUNIDADE ESTRATÉGICA DE INVESTIMENTO: 6 HECTARES EM ZIMPETO 🔑
 *
 * Those are already in the right language and say more than a generated
 * headline could. Regenerating over them would also expose what is in their
 * `neighborhood` column, which on those same rows holds "PRÓXIMO À ROTUNDA"
 * and "antiga Fábrica de Pneus" — free text, not a bairro, and unusable in
 * "Moradia T4 à venda em …".
 */
const GENERATED_EN_HEADLINE =
  /^(?:\d+ Bedroom\s+)?(?:[\d.,]+ m²\s+)?[A-Za-z][A-Za-z ]*\s+for\s+(?:Sale|Rent|Short Stay)(?:\s+in\s+.+)?$/;

/**
 * Whether a stored title was written by the generator or typed by an agent.
 *
 * The property PAGE shows a hand-written title, because an agent who wrote
 * their own H1 chose it deliberately. The CARD must not: a grid of forty is
 * where "🇲🇿 OPORTUNIDADE COMERCIAL PREMIUM 🇲🇿 *VENDE-SE…" gets clamped
 * mid-word, and ui/listing-card.html names that as the first of six faults.
 * So the card asks this and composes its own headline when the answer is no.
 */
export function isGeneratedHeadline(title: string, titlePt?: string | null): boolean {
  // A stored Portuguese headline only ever comes from the generator.
  if (titlePt && titlePt.trim()) return true;
  return GENERATED_EN_HEADLINE.test((title ?? '').trim());
}

/**
 * The headline for a listing, in the language the page is being read in.
 *
 * One function because the same choice is made in three places — the listing
 * page H1, every card in every grid, and the home hero — and three copies of
 * it drift into three different answers for the same listing.
 *
 * Order matters: a stored `titlePt` always wins, then a rebuild, but ONLY for
 * a headline the wizard generated in English. Anything a person wrote is left
 * exactly as they wrote it, in whichever language they wrote it — which is
 * also why an English reader can still meet a Portuguese legacy title, the
 * same trade `descriptionEn` already makes.
 */
export function listingHeadline(p: TitleSource, lang: string): string {
  if (lang !== 'pt') return p.title;

  const stored = p.titlePt?.trim();
  if (stored) return stored;

  if (!GENERATED_EN_HEADLINE.test(p.title.trim())) return p.title;
  return listingTitlePt(p) || p.title;
}

/**
 * Publishing gate, mirrored from the preview's photo step: six photos with at
 * least two interior. Returned rather than thrown so the wizard can show the
 * agent exactly what is short before they reach the end.
 */
/**
 * The words a blocker is written in.
 *
 * Passed in rather than imported, so this module stays free of the wizard's
 * copy file and keeps working for any caller that only wants the English
 * default — and so the step names inside a blocker always match the tab
 * labels the agent is looking at.
 */
export interface BlockerCopy {
  bairro: (step: string) => string;
  price: (step: string) => string;
  photos: (n: number) => string;
  landSize: (step: string) => string;
  duat: (step: string) => string;
  beds: (step: string) => string;
  interior: (step: string) => string;
}

const EN_BLOCKERS: BlockerCopy = {
  bairro: (step) => `Name the bairro — step 1, ${step}`,
  price: (step) => `Set a price — step 2, ${step}`,
  photos: (n) => `Six photos are required — ${n} uploaded, step 6`,
  landSize: (step) => `Set the plot size — step 2, ${step}`,
  duat: (step) => `Say where the DUAT stands — step 3, ${step}`,
  beds: (step) => `Set the number of bedrooms — step 2, ${step}`,
  interior: (step) => `At least two interior shots are required — step 6, ${step}`,
};

const EN_STEPS = ['What & where', 'The numbers', 'Details', 'Features', 'The place', 'Photos', 'Contact'];

export function publishBlockers(
  a: ListingAnswers,
  copy: BlockerCopy = EN_BLOCKERS,
  steps: readonly string[] = EN_STEPS,
): string[] {
  const blockers: string[] = [];
  const isLandType = !isBuilt(a.propertyType);
  const step = (n: number) => steps[n - 1] ?? EN_STEPS[n - 1];
  // Each blocker names the step it lives on. The footer shows only the first
  // one, and "Say where the DUAT stands" is no help when the agent is standing
  // on step 7 and the answer is on step 3.
  if (!a.bairro.trim()) blockers.push(copy.bairro(step(1)));
  if (!a.price) blockers.push(copy.price(step(2)));
  if (a.photos < 6) blockers.push(copy.photos(a.photos));

  if (isLandType) {
    /*
     * A blocker has to be answerable, or it is a dead end.
     *
     * Zoning and the DUAT were both hard blockers here, while the wizard
     * offered "Not sure yet" as the default option on each — so an agent who
     * chose the reassuring-sounding answer got a permanently disabled Submit
     * button and no indication of which step to go back to.
     *
     * The plot size stays a blocker: it is the one thing every seller knows
     * and no plot listing is usable without it. The DUAT stays too, but only
     * because it now has an explicit "Not confirmed" option to choose — so
     * there is always a truthful way through. Zoning drops to a quality hint,
     * since an agent may legitimately not know it and that is not a reason to
     * keep the listing off the site.
     */
    if (!a.landSize) blockers.push(copy.landSize(step(2)));
    if (!a.duat) blockers.push(copy.duat(step(3)));
  } else {
    if (!a.beds) blockers.push(copy.beds(step(2)));
    /*
     * A plot has no interior, so it is never asked for interior shots.
     *
     * This rule used to run for every category. The line above it already
     * exempted land from the bedroom rule, so the branch had been considered
     * and then missed here — with the result that a complete, correctly
     * photographed land listing could never be published at all, because the
     * Submit button stays disabled while any blocker remains.
     */
    if (a.interior < 2) blockers.push(copy.interior(step(6)));
  }

  return blockers;
}
