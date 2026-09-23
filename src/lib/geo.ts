/**
 * Turning what an agent actually has into a point on a map.
 *
 * Before this, a listing's coordinates could only arrive as a literal
 * "Coordinates: -25.96, 32.57" line buried inside the description text, which
 * PropertyDetailClient then parsed back out with a regex and stripped before
 * rendering. Nothing in the guided wizard ever wrote that line, so every
 * listing created through it showed the grey placeholder card instead of a map.
 *
 * An agent in Maputo does not have decimal degrees. They have a Google Maps
 * link, shared on WhatsApp, which is why the paste box accepts every shape
 * Google produces alongside plain coordinates.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Roughly where each city sits, so the picker opens somewhere useful.
 *
 * Only ever a STARTING VIEW for the map — never stored as the property's
 * location. A listing that silently defaulted to the middle of Maputo would be
 * worse than one with no map at all, because the pin would look deliberate.
 */
export const CITY_CENTRE: Record<string, LatLng> = {
  Maputo: { lat: -25.9692, lng: 32.5732 },
  Matola: { lat: -25.9622, lng: 32.4589 },
  Beira: { lat: -19.8436, lng: 34.8389 },
  Nampula: { lat: -15.1165, lng: 39.2666 },
  Pemba: { lat: -12.974, lng: 40.5178 },
  Inhambane: { lat: -23.865, lng: 35.3833 },
  Vilanculos: { lat: -22.0011, lng: 35.3133 },
  'Xai-Xai': { lat: -25.0519, lng: 33.6442 },
};

export const DEFAULT_CENTRE: LatLng = CITY_CENTRE.Maputo;

/** Mozambique's bounding box, used only to warn — never to reject. */
const MZ_BOUNDS = { minLat: -27.0, maxLat: -10.4, minLng: 30.2, maxLng: 41.0 };

export function looksOutsideMozambique(p: LatLng): boolean {
  return (
    p.lat < MZ_BOUNDS.minLat || p.lat > MZ_BOUNDS.maxLat
    || p.lng < MZ_BOUNDS.minLng || p.lng > MZ_BOUNDS.maxLng
  );
}

/** True for the shortened links that only resolve by following a redirect. */
export function isShortMapLink(text: string): boolean {
  return /(?:goo\.gl\/maps|maps\.app\.goo\.gl|g\.co\/kgs)/i.test(text);
}

const PATTERNS: RegExp[] = [
  // .../@-25.9692,32.5732,17z  — the map's own viewport
  /@(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/,
  // ...!3d-25.9692!4d32.5732  — the pinned PLACE, more accurate than the
  // viewport above, so it is tried first where both appear.
  /!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
  // ?q=-25.9692,32.5732 / &ll= / &daddr=
  /[?&](?:q|ll|daddr|sll|center)=(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/i,
  // bare "-25.9692, 32.5732", which is what a phone's share sheet often gives
  /^\s*(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/,
];

/**
 * Pulls a coordinate pair out of pasted text, or null.
 *
 * The place marker (!3d!4d) wins over the viewport centre (@lat,lng): a Google
 * Maps URL usually carries both, and the viewport is wherever the map happened
 * to be scrolled, which can be streets away from the pin.
 */
export function parseLatLng(text: string): LatLng | null {
  const input = (text ?? '').trim();
  if (!input) return null;

  const ordered = [PATTERNS[1], PATTERNS[0], PATTERNS[2], PATTERNS[3]];
  for (const re of ordered) {
    const m = input.match(re);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    // 0,0 is the Atlantic. It is what a broken template produces, never a house.
    if (lat === 0 && lng === 0) continue;
    return { lat: round6(lat), lng: round6(lng) };
  }
  return null;
}

/**
 * Six decimals is about 11cm — far past what a listing needs, and the point
 * where floats stop round-tripping cleanly through JSON and a Postgres column.
 */
export const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** "-25.969200, 32.573200" — what the agent sees once a point is chosen. */
export const formatLatLng = (p: LatLng) => `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`;
