/**
 * What each kind of property is actually asked.
 *
 * Before this file the wizard had one question set for everything. Only the
 * numeric step branched, and only on `isLand` — so a plot was still offered
 * "Furnished", "Air conditioning", "Ensuite bedroom", "Outdoor kitchen" and
 * "Staff quarters", and was never asked its dimensions, its zoning, its DUAT
 * number or whether the road to it is tarred.
 *
 * The cost of that showed up twice. A buyer saw it directly — every listing
 * read the same, because the form collected the same eleven facts about a
 * beach plot as about a city apartment, and no amount of rewriting can make
 * two descriptions differ on information that was never collected. And the
 * agents showed it indirectly: scanning the 22 listings already in the
 * database, they had hand-typed road access into 15 of them, zoning into 12,
 * title status into 9, suites and plot dimensions into 7 each — cramming it
 * into SHOUTY TITLES because the form gave them nowhere else to put it.
 *
 * So the question set is per category, and so is the description built from
 * it. This file holds the difference; listing-copy.ts reads it.
 */

export type CategoryKey = 'House' | 'Apartment' | 'Land' | 'Commercial' | 'Beach house';

/** Fields that only some categories ask for. Blank/0 means "not answered". */
export interface CategoryAnswers {
  // --- built categories -----------------------------------------------------
  /** How the building presents. The strongest single differentiator in copy. */
  condition: '' | 'new' | 'renovated' | 'good' | 'needs work';
  /** Bedrooms that have their own bathroom. "T4 com 2 suítes" is the local idiom. */
  suites: number;
  /** Floors the property itself occupies — a triplex is not a flat T4. */
  storeys: number;
  /**
   * Three-way, replacing the old Furnished chip.
   *
   * A yes/no could not say "semi-mobilado", which is how a large share of the
   * rental stock here is actually let, so agents wrote it into the body text
   * instead and the chip stayed off — making the property invisible to anyone
   * filtering on furnishing.
   */
  furnishing: '' | 'unfurnished' | 'semi' | 'full';

  // --- apartment ------------------------------------------------------------
  /** Which floor. 0 is the ground floor (rés-do-chão), -1 means not answered. */
  floor: number;

  // --- land -----------------------------------------------------------------
  /** Frontage and depth in metres. Agents already write "15m x 30m" by hand. */
  frontage: number;
  depth: number;
  zoning: '' | 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'mixed';
  /**
    * DUAT is the land-use right; its state is the first thing a buyer asks.
    *
    * 'unknown' is a real answer, not the absence of one. Without it the only
    * way to say "I have not checked" was to leave the field blank — and blank
    * is what the publish gate refuses, so an agent who genuinely did not know
    * could never submit at all. A buyer is better served by "DUAT por
    * confirmar" on the page than by the listing never appearing.
    */
  duat: '' | 'in order' | 'in progress' | 'none' | 'unknown';
  roadSurface: '' | 'tarred' | 'gravel' | 'dirt';
  /** What is standing on it, if anything. One listing here sells a "RUÍNA". */
  structures: '' | 'none' | 'ruin' | 'foundation' | 'unfinished building';

  // --- commercial -----------------------------------------------------------
  commercialUse: '' | 'office' | 'retail' | 'warehouse' | 'industrial' | 'restaurant';
}

export const EMPTY_CATEGORY_ANSWERS: CategoryAnswers = {
  condition: '', suites: 0, storeys: 0, furnishing: '',
  floor: -1,
  frontage: 0, depth: 0, zoning: '', duat: '', roadSurface: '', structures: '',
  commercialUse: '',
};

/** Which numeric fields the "numbers" step shows, per category. */
export const NUMERIC_FIELDS: Record<CategoryKey, readonly string[]> = {
  House: ['beds', 'baths', 'suites', 'storeys', 'parking', 'buildingSize', 'landSize'],
  Apartment: ['beds', 'baths', 'suites', 'floor', 'parking', 'buildingSize'],
  'Beach house': ['beds', 'baths', 'suites', 'storeys', 'parking', 'buildingSize', 'landSize'],
  Commercial: ['baths', 'parking', 'buildingSize', 'landSize'],
  Land: ['landSize', 'frontage', 'depth'],
};

/**
 * Which feature chips each category is offered.
 *
 * Absent from a list means the chip is not shown at all — not shown greyed
 * out, not shown and ignored. A plot is not asked about a pool.
 */
export const FEATURE_SCOPE: Record<string, readonly CategoryKey[]> = {
  // indoor
  'Air conditioning': ['House', 'Apartment', 'Beach house', 'Commercial'],
  'Ensuite bedroom': ['House', 'Apartment', 'Beach house'],
  'Fibre internet': ['House', 'Apartment', 'Beach house', 'Commercial'],
  // outdoor
  Pool: ['House', 'Apartment', 'Beach house'],
  Garden: ['House', 'Apartment', 'Beach house', 'Commercial'],
  'Sea view': ['House', 'Apartment', 'Beach house', 'Commercial', 'Land'],
  'Direct beach access': ['House', 'Beach house', 'Land'],
  // security & services
  '24/7 security': ['House', 'Apartment', 'Beach house', 'Commercial', 'Land'],
  'Backup generator': ['House', 'Apartment', 'Beach house', 'Commercial'],
  'Borehole / water tank': ['House', 'Apartment', 'Beach house', 'Commercial', 'Land'],
  Solar: ['House', 'Apartment', 'Beach house', 'Commercial'],
  Lift: ['Apartment', 'Commercial'],
  // annex
  'Outdoor kitchen': ['House', 'Beach house'],
  'Store room': ['House', 'Apartment', 'Beach house', 'Commercial'],
  'Staff quarters': ['House', 'Apartment', 'Beach house'],
  'Additional bathroom': ['House', 'Apartment', 'Beach house', 'Commercial'],
  // the plot itself — the land questions that are genuinely yes/no
  'Walled / fenced': ['House', 'Beach house', 'Commercial', 'Land'],
  'Corner plot': ['House', 'Beach house', 'Commercial', 'Land'],
  'Not flood-prone': ['House', 'Beach house', 'Commercial', 'Land'],
  'Water at the boundary': ['Land'],
  'Electricity at the boundary': ['Land'],
  // paperwork
  // Land is NOT offered this chip: it answers the DUAT as a three-way question
  // (in order / in progress / none), which a yes/no tick cannot express and
  // would contradict.
  'DUAT in order': ['House', 'Apartment', 'Beach house', 'Commercial'],
};

/** Portuguese for every answer above that reaches a buyer. */
export const CATEGORY_LABEL_PT = {
  condition: {
    new: 'nova', renovated: 'renovada', good: 'em bom estado', 'needs work': 'para recuperar',
  },
  conditionM: {
    new: 'novo', renovated: 'renovado', good: 'em bom estado', 'needs work': 'para recuperar',
  },
  furnishing: { unfurnished: 'sem mobília', semi: 'semimobilada', full: 'mobilada' },
  furnishingM: { unfurnished: 'sem mobília', semi: 'semimobilado', full: 'mobilado' },
  zoning: {
    residential: 'residencial', commercial: 'comercial', industrial: 'industrial',
    agricultural: 'agrícola', mixed: 'misto',
  },
  duat: {
    'in order': 'DUAT regularizado', 'in progress': 'DUAT em processo',
    none: 'sem DUAT', unknown: 'DUAT por confirmar',
  },
  roadSurface: { tarred: 'estrada alcatroada', gravel: 'estrada de saibro', dirt: 'estrada de terra' },
  structures: {
    none: '', ruin: 'com uma ruína', foundation: 'com fundações feitas',
    'unfinished building': 'com uma construção por acabar',
  },
  commercialUse: {
    office: 'escritórios', retail: 'comércio', warehouse: 'armazém',
    industrial: 'uso industrial', restaurant: 'restauração',
  },
} as const;

export const CATEGORY_LABEL_EN = {
  condition: {
    new: 'newly built', renovated: 'recently renovated', good: 'in good condition',
    'needs work': 'in need of work',
  },
  furnishing: { unfurnished: 'unfurnished', semi: 'semi-furnished', full: 'fully furnished' },
  zoning: {
    residential: 'residential', commercial: 'commercial', industrial: 'industrial',
    agricultural: 'agricultural', mixed: 'mixed use',
  },
  duat: {
    'in order': 'DUAT in order', 'in progress': 'DUAT in progress',
    none: 'no DUAT yet', unknown: 'DUAT not yet confirmed',
  },
  roadSurface: { tarred: 'a tarred road', gravel: 'a gravel road', dirt: 'a dirt road' },
  structures: {
    none: '', ruin: 'with a ruin on it', foundation: 'with foundations laid',
    'unfinished building': 'with an unfinished building on it',
  },
  commercialUse: {
    office: 'offices', retail: 'retail', warehouse: 'warehousing',
    industrial: 'industrial use', restaurant: 'restaurant use',
  },
} as const;

/** The select options the wizard renders, in the order they should appear. */
export const CHOICES = {
  condition: ['new', 'renovated', 'good', 'needs work'],
  furnishing: ['unfurnished', 'semi', 'full'],
  zoning: ['residential', 'commercial', 'industrial', 'agricultural', 'mixed'],
  duat: ['in order', 'in progress', 'none', 'unknown'],
  roadSurface: ['tarred', 'gravel', 'dirt'],
  structures: ['none', 'ruin', 'foundation', 'unfinished building'],
  commercialUse: ['office', 'retail', 'warehouse', 'industrial', 'restaurant'],
} as const;

/** Which of the above a category is asked. Order is the order on screen. */
export const CATEGORY_QUESTIONS: Record<CategoryKey, readonly (keyof typeof CHOICES)[]> = {
  House: ['condition', 'furnishing'],
  Apartment: ['condition', 'furnishing'],
  'Beach house': ['condition', 'furnishing'],
  Commercial: ['condition', 'commercialUse'],
  Land: ['zoning', 'duat', 'roadSurface', 'structures'],
};

/** A plot has no interior, so it cannot be asked for interior photographs. */
export const REQUIRES_INTERIOR_SHOTS: Record<CategoryKey, boolean> = {
  House: true, Apartment: true, 'Beach house': true, Commercial: true, Land: false,
};

export const isBuilt = (t: string) => t !== 'Land';

/**
 * Upper bounds for the area fields, used for a warning and never a hard block.
 *
 * A three-bedroom apartment was published at 23,323 m² because the input had
 * `min={0}` and no ceiling, and that number then went into the description,
 * the title tag and the JSON-LD with nothing questioning it. The agent is
 * still allowed to publish — some of these really are large — but they are
 * told, which is all a typo needs.
 */
export const AREA_SANITY: Record<CategoryKey, { building: number; land: number }> = {
  House: { building: 2_000, land: 20_000 },
  Apartment: { building: 800, land: 0 },
  'Beach house': { building: 2_000, land: 20_000 },
  Commercial: { building: 20_000, land: 100_000 },
  Land: { building: 0, land: 1_000_000 },
};
