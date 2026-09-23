/**
 * What the spec row on a listing card prints, chosen by property type.
 *
 * From ui/listing-card.html, which calls the old behaviour "the worst fault on
 * the card, and it is not a styling problem": every property was forced
 * through one house-shaped template, so a complex of six shops advertised
 * itself as "6 Beds · 1 Baths". That is a data-model bug wearing a UI costume.
 *
 * ONE function, keyed on type. Adding a property type means adding a case here
 * and nothing else — no new component, no new branch in the card.
 *
 * Nothing here invents a figure. Where a listing has not been asked for
 * something the ideal row would show, the row is shorter rather than padded
 * out with a plausible guess.
 */

/** Everything the row can draw on, all of it optional. */
export interface SpecSource {
  type?: string | null;
  listingType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  /** Internal floor area for a building; plot size for land. */
  area?: number | null;
  /** The wizard's category answers: floor, parking, duat, commercialUse… */
  details?: Record<string, unknown> | null;
}

/** The words the row needs, so this module never hard-codes a language. */
export interface SpecWords {
  bed: string;
  bath: string;
  /** "3rd floor" / "3.º andar" — takes the number. */
  floor: (n: number) => string;
  groundFloor: string;
  plot: string;
  parking: string;
  sleeps: string;
  duat: Record<string, string>;
  use: Record<string, string>;
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  const s = String(v ?? '').trim();
  return s.length > 0 ? s : null;
}

/** 1200 → "1,200". Grouped so a plot size reads as a size. */
const group = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n));

/**
 * Which shape of row this property gets.
 *
 * Short stay is decided by the LISTING type, not the property type: a house
 * let by the night is sold on how many it sleeps, not on its plot.
 */
function shapeOf(p: SpecSource): 'land' | 'commercial' | 'apartment' | 'stay' | 'house' {
  const t = (p.type ?? '').toLowerCase();
  if ((p.listingType ?? '').toLowerCase().includes('short')) return 'stay';
  if (t.includes('land') || t.includes('terreno') || t.includes('plot')) return 'land';
  if (t.includes('commercial') || t.includes('office') || t.includes('shop')
      || t.includes('warehouse') || t.includes('retail')) return 'commercial';
  if (t.includes('apartment') || t.includes('penthouse') || t.includes('studio')
      || t.includes('flat')) return 'apartment';
  return 'house';
}

export function listingSpecs(p: SpecSource, w: SpecWords): string[] {
  const d = (p.details ?? {}) as Record<string, unknown>;
  const beds = num(p.bedrooms) ?? 0;
  const baths = num(p.bathrooms) ?? 0;
  const area = num(p.area) ?? 0;

  const bedPart = beds > 0 ? `${beds} ${w.bed}` : null;
  const bathPart = baths > 0 ? `${baths} ${w.bath}` : null;
  const areaPart = area > 0 ? `${group(area)} m²` : null;

  switch (shapeOf(p)) {
    /*
     * Land is state-owned here, so whether the DUAT is registered is not a
     * detail — it is the whole transaction. It goes on the card.
     */
    case 'land': {
      const duat = str(d.duat);
      return [
        area > 0 ? `${group(area)} m² ${w.plot}` : null,
        duat ? (w.duat[duat] ?? duat) : null,
      ].filter(Boolean) as string[];
    }

    /*
     * Never bedrooms. A shop complex is bought on floor area, parking and what
     * it is fitted out for.
     *
     * The reference row is "6 units · 580 m² · 4 parking"; unit COUNT is not a
     * question the wizard asks yet, so the row prints the two figures that do
     * exist rather than guessing at the third.
     */
    case 'commercial': {
      const parking = num(d.parking) ?? 0;
      const use = str(d.commercialUse);
      return [
        areaPart,
        parking > 0 ? `${parking} ${w.parking}` : null,
        use ? (w.use[use] ?? use) : null,
      ].filter(Boolean) as string[];
    }

    /*
     * Which floor matters more than plot size, and it is the question a buyer
     * asks before "is there a lift".
     */
    case 'apartment': {
      const floor = num(d.floor);
      const floorPart =
        floor === null || floor < 0 ? null : floor === 0 ? w.groundFloor : w.floor(floor);
      return [bedPart, bathPart, floorPart ?? areaPart].filter(Boolean) as string[];
    }

    /*
     * Capacity leads, because it is what a short-stay guest filters on.
     * `sleeps` is not collected yet, so bedrooms lead instead — the row is
     * shorter rather than claiming a capacity nobody stated.
     */
    case 'stay':
      return [bedPart, bathPart, areaPart].filter(Boolean) as string[];

    /* The three figures a family filters on. Internal area, not plot. */
    default:
      return [bedPart, bathPart, areaPart].filter(Boolean) as string[];
  }
}

/**
 * A price cut, as something the card can show.
 *
 * Only a REDUCTION is surfaced. A rise is not news a buyer wants and a
 * marketplace that advertises them is working against its own visitors; the
 * figure is still recorded, it is simply not a badge.
 */
export function priceDrop(
  price: number,
  previousPrice?: number | null,
  changedAt?: string | Date | null,
): { percent: number; since: Date } | null {
  if (!previousPrice || !changedAt) return null;
  if (!(previousPrice > price)) return null;

  const since = new Date(changedAt);
  if (Number.isNaN(since.getTime())) return null;

  /* A reduction stops being news. Ninety days is long enough that a slow
     market still shows it, short enough that it is not permanent furniture. */
  if (Date.now() - since.getTime() > 90 * 86_400_000) return null;

  const percent = Math.round(((previousPrice - price) / previousPrice) * 100);
  return percent >= 1 ? { percent, since } : null;
}

/**
 * "3 weeks ago". An absolute date makes the reader do arithmetic, which is
 * a whole row of the card spent on a subtraction.
 */
export function relativeAge(iso: string | Date, lang: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';

  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  const pt = lang === 'pt';

  if (days <= 0) return pt ? 'hoje' : 'today';
  if (days === 1) return pt ? 'ontem' : 'yesterday';
  if (days < 7) return pt ? `há ${days} dias` : `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return pt
      ? `há ${weeks} semana${weeks === 1 ? '' : 's'}`
      : `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return pt ? `há ${months} ${months === 1 ? 'mês' : 'meses'}` : `${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = Math.floor(days / 365);
  return pt ? `há ${years} ano${years === 1 ? '' : 's'}` : `${years} year${years === 1 ? '' : 's'} ago`;
}

/**
 * The one status chip, or none.
 *
 * "A badge that is on every card has stopped being a signal" — so the listing
 * type is NOT a status. The price already says whether something is a rental;
 * this slot carries only what cannot be inferred from the rest of the card.
 *
 * Order is priority: a paid placement must be labelled even when the listing
 * is also new, because that label is a disclosure rather than a decoration.
 */
export type ChipKind = 'promoted' | 'reduced' | 'new' | null;

export function statusChip(opts: {
  promoted?: boolean;
  dropPercent?: number | null;
  publishedAt?: string | Date | null;
}): ChipKind {
  if (opts.promoted) return 'promoted';
  if (opts.dropPercent && opts.dropPercent >= 1) return 'reduced';

  if (opts.publishedAt) {
    const d = new Date(opts.publishedAt);
    if (!Number.isNaN(d.getTime()) && Date.now() - d.getTime() <= 7 * 86_400_000) return 'new';
  }
  return null;
}

/**
 * The headline the CARD shows.
 *
 * Never the raw agent-typed string. ui/listing-card.html is explicit: "The
 * card shows generated.h1. If a listing predates the interview it falls back
 * to type + bairro + city, which is still correct — never to the raw typed
 * string." An agent title is a WhatsApp habit of dashes, repeated
 * "Arrenda-se" and shouting capitals, and a two-line clamp cuts it mid-word.
 *
 * A composed fallback is shorter, always grammatical, and says the same thing.
 */
export interface HeadlineWords {
  /** Translated property type, e.g. "Moradia" for "House". */
  type: (raw: string) => string;
  /** Sentence-case intent: "à venda" / "for sale" — NOT the badge's "À venda". */
  forSale: string;
  forRent: string;
  shortStay: string;
  auction: string;
  /** "em" / "in" — joins the headline to the place. */
  inPlace: string;
  /** English only: "bedroom". Portuguese uses the T-number instead. */
  bedroom: string;
  pt: boolean;
}

export function cardHeadline(
  p: SpecSource & { neighborhood?: string | null; city?: string | null },
  w: HeadlineWords,
): string {
  const intent =
    (p.listingType ?? '') === 'Buy' ? w.forSale
    : (p.listingType ?? '') === 'Rent' ? w.forRent
    : (p.listingType ?? '') === 'Short Stay' ? w.shortStay
    : (p.listingType ?? '') === 'Auction' ? w.auction
    : '';

  const beds = num(p.bedrooms) ?? 0;
  const shape = shapeOf(p);
  /* Bedrooms lead a home and are meaningless on land or a shop. */
  const countsBeds = beds > 0 && shape !== 'land' && shape !== 'commercial';
  const type = w.type(p.type ?? '');

  /*
   * The two languages put these words in different orders, and translating
   * word-for-word produces "3 quartos Moradia À venda" — which is not a
   * sentence in either. Portuguese names the type first and carries the
   * bedroom count as a T-number, the way every listing in Mozambique is
   * written: "Moradia T3 à venda em Fomento, Maputo".
   */
  const head = w.pt
    ? `${type}${countsBeds ? ` T${beds}` : ''}${intent ? ` ${intent}` : ''}`
    : `${countsBeds ? `${beds} ${w.bedroom} ` : ''}${type}${intent ? ` ${intent}` : ''}`;

  const place = [p.neighborhood, p.city].filter(Boolean).join(', ');
  return place ? `${head} ${w.inPlace} ${place}` : head;
}
