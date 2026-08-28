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
export function formatListingTitle(title: string): string {
  if (!title) return '';

  const letters = title.replace(/[^\p{L}]/gu, '');
  if (letters.length === 0) return title;

  const upper = title.replace(/[^\p{Lu}]/gu, '').length;
  if (upper / letters.length < 0.7) return title;

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
