/**
 * Article text → structured blocks, and the language an article is written in.
 *
 * Editors write in a plain textarea, one line per paragraph or heading, and
 * rarely leave blank lines between them. Rendering that as one <p> collapsed
 * every heading and paragraph into a single wall of text, which readers skip
 * and search engines read as one unstructured block. Lines are classified
 * instead: explicit Markdown (`## `, `### `, `- `) always wins; otherwise a
 * short line with no closing punctuation that is followed by more text is a
 * heading (`…:` ones a sub-heading).
 */

import type { Language } from '@/lib/translations';

export type BlogBlock =
  | { type: 'h2' | 'h3' | 'p'; text: string }
  | { type: 'ul'; items: string[] };

const LIST_ITEM = /^(?:[-*•]|\d{1,2}[.)])\s+/;

function normalise(text: string): string {
  return text.toLowerCase().replace(/[\s.,:;!?]+$/g, '').replace(/\s+/g, ' ').trim();
}

/** A short title-like line: no sentence punctuation, no web address. */
function isTitleLike(line: string): boolean {
  if (line.length < 3 || line.length > 90) return false;
  if (/[.!?;,:]$/.test(line) || /\.\s/.test(line.replace(/^\d{1,2}[.)]\s+/, ''))) return false;
  if (/https?:|www\./i.test(line)) return false;
  return line.split(/\s+/).length <= 12;
}

type Kind = 'h2' | 'h3' | 'li' | 'p';

/** "Phase 2: …", "Passo 3 — …": always a section heading, never a list item. */
const SECTION = /^(phase|step|part|section|fase|passo|parte|secção)\s+\d/i;

export function parseBlogContent(content: string, title?: string): BlogBlock[] {
  const lines = content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\*\*/g, '').trim()) // stray Markdown bold markers
    .filter(Boolean);

  // Many posts repeat the title as their first line; the page already shows
  // it as the <h1>, and a second copy reads as duplicate content.
  if (title && lines.length > 1 && normalise(lines[0]) === normalise(title)) lines.shift();

  // First pass: what each line is on its own.
  const kinds: Kind[] = [];
  const texts: string[] = [];
  lines.forEach((line, i) => {
    const hasNext = i < lines.length - 1;
    const md = /^(#{2,4})\s+(.*)$/.exec(line);
    if (md) {
      kinds.push(md[1].length === 2 ? 'h2' : 'h3');
      texts.push(md[2].trim());
    } else if (LIST_ITEM.test(line)) {
      kinds.push('li');
      texts.push(line);
    } else if (hasNext && line.endsWith(':') && isTitleLike(line.slice(0, -1)) && line.split(/\s+/).length <= 8) {
      kinds.push('h3'); // "Collect Project Specifications:"
      texts.push(line.slice(0, -1).trim());
    } else if (hasNext && isTitleLike(line)) {
      kinds.push('h2');
      texts.push(line);
    } else {
      kinds.push('p');
      texts.push(line);
    }
  });

  // Second pass: context. Several title-like lines in a row are a list, not
  // a stack of headings; a lone numbered title ("1. The Case in Mozambique")
  // between paragraphs is a section heading, not a one-item list.
  for (let i = 0; i < kinds.length; ) {
    if (kinds[i] !== 'h2' || /^#/.test(lines[i])) {
      i++;
      continue;
    }
    let j = i;
    while (j < kinds.length && kinds[j] === 'h2' && !/^#/.test(lines[j]) && !(j > i && SECTION.test(lines[j]))) j++;
    if (j - i >= 2) for (let k = i; k < j; k++) if (!SECTION.test(lines[k])) kinds[k] = 'li';
    i = j;
  }
  kinds.forEach((kind, i) => {
    if (kind !== 'li' || !/^\d{1,2}[.)]\s/.test(lines[i])) return;
    const alone = kinds[i - 1] !== 'li' && kinds[i + 1] !== 'li';
    if (alone && isTitleLike(lines[i])) kinds[i] = 'h2'; // keeps its number
  });

  const blocks: BlogBlock[] = [];
  kinds.forEach((kind, i) => {
    if (kind === 'li') {
      const item = texts[i].replace(LIST_ITEM, '');
      const last = blocks[blocks.length - 1];
      if (last?.type === 'ul') last.items.push(item);
      else blocks.push({ type: 'ul', items: [item] });
    } else {
      blocks.push({ type: kind, text: texts[i] });
    }
  });
  return blocks;
}

const PT_WORDS = new Set(['de', 'que', 'para', 'com', 'não', 'uma', 'os', 'as', 'das', 'dos', 'em', 'na', 'no', 'se', 'por', 'mais', 'ao', 'à', 'são', 'é']);
const EN_WORDS = new Set(['the', 'and', 'of', 'to', 'for', 'with', 'is', 'in', 'on', 'that', 'this', 'are', 'by', 'from', 'it', 'be', 'or', 'an', 'as', 'at']);

/**
 * The language an article is written in. Posts carry no language field and
 * the team writes in both, so it is read from the text: common function
 * words decide, and ties fall back to Portuguese (the site's main language).
 */
export function detectTextLang(...texts: Array<string | null | undefined>): Language {
  let pt = 0;
  let en = 0;
  const words = texts.join(' ').toLowerCase().match(/[a-zà-ú]+/g) ?? [];
  for (const w of words.slice(0, 600)) {
    if (PT_WORDS.has(w)) pt++;
    else if (EN_WORDS.has(w)) en++;
  }
  return en > pt ? 'en' : 'pt';
}
