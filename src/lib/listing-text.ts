/**
 * Turning stored listing text into something safe to print in one line.
 *
 * Every listing posted before the guided wizard came through a free-text box,
 * and what went into that box was a WhatsApp broadcast: *asterisk bold*,
 * _underscore italics_, "---" rules, emoji, and the same sentence pasted twice.
 * ListingDescription already normalises that for the body copy, but anywhere
 * showing a SINGLE line — the featured panel's standfirst, a meta description,
 * a share preview — was printing it raw.
 *
 * Display-layer only. The stored text is never touched, so an agent editing
 * their listing still sees exactly what they wrote.
 */

import { formatListingTitle } from '@/lib/utils';

/** WhatsApp emphasis, section rules, and the emoji people bracket a shout with. */
export function stripListingMarkup(raw: string): string {
  return (raw ?? '')
    // Emphasis markers, kept non-greedy so "*a* and *b*" loses both pairs only.
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // A line of dashes or underscores is a divider, not a sentence.
    .replace(/^[-–—_*]{3,}$/gm, ' ')
    /*
     * Pictographs, flags and the variation selectors that follow them.
     * A title reading "🇲🇿 OPORTUNIDADE 🇲🇿" is using the flag as punctuation,
     * and it survives into the <title> tag and the share card if left in.
     */
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Is this text SHOUTING?
 *
 * Seven letters in ten in capitals, over a string long enough for that to be a
 * choice rather than an acronym.
 */
export function isShouting(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, '');
  if (letters.length < 8) return false;
  const upper = text.replace(/[^\p{Lu}]/gu, '').length;
  return upper / letters.length >= 0.7;
}

/**
 * One sentence, plain, for the line under a headline.
 *
 * The featured panel was printing the whole description under a title that was
 * the same sentence — so the reader was made to fail at reading it twice, once
 * lowercased and once in capitals. A standfirst is one sentence and stops.
 */
export function standfirst(raw: string, maxChars = 190): string {
  const clean = stripListingMarkup(raw ?? '');
  if (!clean) return '';

  /*
   * The first sentence, but never a fragment. A description often opens with
   * a heading line ("DESCRIÇÃO") before the prose, so anything under about
   * twenty-five characters is skipped rather than shown as the standfirst.
   */
  const sentences = clean
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && /\p{L}/u.test(s));

  /*
   * A standfirst in capitals is still shouting.
   *
   * These descriptions open with "OPORTUNIDADE ESTRATÉGICA DE INVESTIMENTO:
   * 6 HECTARES EM ZIMPETO" — a WhatsApp broadcast's opening line. Printed as
   * stored it is a shout in the most prominent block on the site, so it goes
   * through the same guard the headlines use: untouched unless it is genuinely
   * shouting, and then capitalised word by word so Zimpeto keeps its capital
   * and "de" and "em" do not gain one.
   */
  const first = formatListingTitle(sentences[0] ?? clean);
  if (first.length <= maxChars) return first;

  // Cut on a word boundary and let the ellipsis do its job honestly.
  const cut = first.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\s]+$/, '')}…`;
}

/**
 * "MT 25,000,000" over 1,500 m² → "MT 16,667 / m²".
 *
 * How commercial land is actually compared in this market, and no competitor
 * prints it. Returns null when the sum would be meaningless — a rental, or a
 * property with no area recorded.
 */
export function pricePerSqm(
  price: number,
  area: number,
  priceUnit: string,
): number | null {
  // Only a sale price divides sensibly; rent per m² per month is a different
  // figure that would be read as the same one.
  if (priceUnit !== 'sale') return null;
  if (!(price > 0) || !(area > 0)) return null;
  return Math.round(price / area);
}
