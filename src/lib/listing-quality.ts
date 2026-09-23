/**
 * Listing completeness score.
 *
 * The design reference shows a quality column with a score and a "N items
 * missing" line. This computes that from fields the listing actually has, so
 * the number means something: it is the share of the things a buyer needs in
 * order to take a listing seriously.
 *
 * PROVISIONAL WEIGHTING. The build spec puts the real rulebook in Phase 3,
 * gated on the bairro gazetteer decision — once that lands, the linter there
 * supersedes this. Until then a measured completeness figure beats an empty
 * column, and beats a fabricated one.
 *
 * Bands follow the preview: >= 85 good, >= 60 warn, below that critical.
 */

export interface QualityInput {
  description?: string | null;
  images?: string[] | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  neighborhood?: string | null;
  address?: string | null;
  amenities?: string[] | null;
  type?: string | null;
}

export interface QualityResult {
  score: number;
  missing: string[];
  band: 'good' | 'warn' | 'crit';
}

/** Land has no bedrooms or bathrooms, so it is not marked down for lacking them. */
function isLand(type?: string | null): boolean {
  return /land|plot|terreno/i.test(type ?? '');
}

export function listingQuality(p: QualityInput): QualityResult {
  let score = 0;
  const missing: string[] = [];

  // Photos carry the most weight: a listing without them does not get viewed.
  const photos = p.images?.length ?? 0;
  if (photos >= 3) score += 20;
  else if (photos >= 1) { score += 10; missing.push('more photos'); }
  else missing.push('photos');

  const desc = (p.description ?? '').trim().length;
  if (desc >= 120) score += 15;
  else if (desc >= 40) { score += 8; missing.push('fuller description'); }
  else missing.push('description');

  if ((p.price ?? 0) > 0) score += 15;
  else missing.push('price');

  if (isLand(p.type)) {
    // Not applicable — award the points rather than penalising the listing.
    score += 10;
  } else if ((p.bedrooms ?? 0) > 0 && (p.bathrooms ?? 0) > 0) {
    score += 10;
  } else {
    missing.push('bedrooms / bathrooms');
  }

  if ((p.area ?? 0) > 0) score += 10;
  else missing.push('floor area');

  if ((p.neighborhood ?? '').trim()) score += 10;
  else missing.push('neighbourhood');

  if ((p.address ?? '').trim()) score += 10;
  else missing.push('street address');

  const amenities = p.amenities?.length ?? 0;
  if (amenities >= 3) score += 10;
  else if (amenities >= 1) { score += 5; missing.push('more amenities'); }
  else missing.push('amenities');

  const band: QualityResult['band'] = score >= 85 ? 'good' : score >= 60 ? 'warn' : 'crit';
  return { score, missing, band };
}
