import { Property } from '@/types';

/** Prices across the platform are quoted in Meticais and rendered as "MT 1,250,000". */
export const CURRENCY_LABEL = 'MT';

export function formatPrice(price: number, unit: string): string {
  const formatted = `${CURRENCY_LABEL} ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(price)}`;

  switch (unit) {
    case 'monthly': return `${formatted}`;
    case 'nightly': return `${formatted}`;
    case 'sale': return formatted;
    default: return formatted;
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/**
 * Connectors that stay lowercase inside a title (PT + EN), unless they lead it.
 */
const TITLE_MINOR_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'ao', 'aos',
  'a', 'o', 'as', 'os', 'um', 'uma', 'com', 'por', 'para', 'sem', 'sob',
  'and', 'or', 'of', 'the', 'in', 'on', 'at', 'for', 'to', 'with', 'an',
]);

/**
 * Listing titles are typed by agents and often arrive fully capitalised
 * ("OPORTUNIDADE RARA - TERRENO EM MAPULENE"), which reads as shouting and
 * fights the type scale. Only rewrite when a title is mostly uppercase, so
 * titles an agent cased deliberately are left exactly as written.
 */
export function formatListingTitle(raw: string): string {
  if (!raw) return '';

  /*
   * WhatsApp emphasis and flag punctuation come off first.
   *
   * These titles were pasted out of a broadcast, so `*VENDE-SE …*` and a pair
   * of flag emoji bracketing the headline reached the H1, the breadcrumb and
   * the <title> tag. Display-layer only — the stored string is untouched, and
   * an agent editing the listing still sees exactly what they wrote.
   */
  const title = raw
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const letters = title.replace(/[^\p{L}]/gu, '');
  if (letters.length === 0) return title;

  const upper = title.replace(/[^\p{Lu}]/gu, '').length;

  /*
   * A ratio alone misses the commonest real case.
   *
   * "MZ OPORTUNIDADE COMERCIAL PREMIUM MZ VENDE-SE ESPAÇO NA BERMA DA AV.
   * GERALD CANDIDO MONDLANE _Conhecida como Av. Dona Alice - Zona de Alta
   * Movimentação_" is plainly shouting, but the lower-case tail drags the
   * overall ratio under 70% and it was returned untouched — so the H1, the
   * breadcrumb and the <title> all carried the shout.
   *
   * A run of four or more consecutive words in full capitals is shouting
   * whatever the rest of the string does. Four rather than three, so an
   * ordinary title containing "DUAT" or "T3 EN1" is left alone.
   */
  const capsRun = /(?:\p{Lu}{2,}[^\p{L}]+){3,}\p{Lu}{2,}/u.test(title);
  if (upper / letters.length < 0.7 && !capsRun) return title;

  let isFirst = true;
  return title
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s*$/.test(token)) return token;

      const bare = token.replace(/[^\p{L}\p{N}]/gu, '');
      // Codes like T3, N1, EN1 — a short letter+digit mix — keep their case.
      if (bare.length <= 4 && /\d/.test(bare) && /\p{L}/u.test(bare)) {
        isFirst = false;
        return token;
      }

      const lower = token.toLocaleLowerCase();
      const leadsTitle = isFirst;
      isFirst = false;

      if (!leadsTitle && TITLE_MINOR_WORDS.has(bare.toLocaleLowerCase())) return lower;

      // Capitalise the first letter, wherever the punctuation lets it start.
      return lower.replace(/\p{L}/u, (ch) => ch.toLocaleUpperCase());
    })
    .join('');
}

/** Convert a listing title to sentence case for the spacious property detail header. */
export function formatListingSentence(title: string): string {
  if (!title) return '';

  /*
   * This used to lowercase the WHOLE string and re-capitalise one letter, so
   * "VENDE-SE ESPAÇO NA BERMA DA AV. GERALD CANDIDO MONDLANE" came out as
   * "Vende-se espaço na berma da av. gerald candido mondlane" — every proper
   * noun destroyed, on the home page hero and the property page H1.
   *
   * Portuguese with its names in lower case reads as machine output to every
   * Mozambican who sees it, and the featured-slot review names it as the fault
   * to chase first because it is not confined to one block.
   *
   * formatListingTitle() already solves this properly: it only intervenes when
   * the text is genuinely shouting, and then capitalises word by word so names
   * keep their capitals and codes like T3 or EN1 keep their shape. A text that
   * is not shouting is returned untouched, which is what a hand-written
   * sentence deserves.
   */
  return formatListingTitle(title);
}
