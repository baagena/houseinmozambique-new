import type { Language } from '@/lib/translations';

/**
 * Every public page has two addresses: the Portuguese one (`/properties`) and
 * an English one under `/en` (`/en/properties`).
 *
 * The language switch alone only changed the page in the visitor's browser
 * after it loaded, so Google only ever read the Portuguese copy, and an
 * English search had nothing English to match.
 *
 * Inside the app the language is the first route segment, `src/app/[lang]`.
 * src/proxy.ts maps the public addresses onto it — `/properties` is served by
 * `/pt/properties`, `/en/properties` by `/en/properties` — so pages can be
 * cached per language, which a request header (the previous mechanism) does
 * not allow.
 */
export const SITE_LANGS = ['pt', 'en'] as const satisfies readonly Language[];
export const DEFAULT_LANG: Language = 'pt';

/** The [lang] route param as a Language; anything unexpected is Portuguese. */
export function toSiteLang(value: string | undefined): Language {
  return value === 'en' ? 'en' : 'pt';
}

/** The internal `/pt` prefix. Never a public address: the proxy redirects it away. */
export const PT_PREFIX = '/pt';
export const EN_PREFIX = '/en';

/** True for `/en` and `/en/...`, not for `/energy`. */
export function isEnglishPath(pathname: string): boolean {
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`);
}

/** `/en/properties` → `/properties`; `/en` → `/`. */
export function stripLangPrefix(pathname: string): string {
  if (!isEnglishPath(pathname)) return pathname;
  return pathname.slice(EN_PREFIX.length) || '/';
}

/** A site path in the given language: `/properties` → `/en/properties` for English. */
export function localizedPath(path: string, lang: Language): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang !== 'en') return clean;
  return clean === '/' ? EN_PREFIX : `${EN_PREFIX}${clean}`;
}

/** `/pt/properties` → `/properties`; `/pt` → `/`. */
export function stripPtPrefix(pathname: string): string | null {
  if (pathname === PT_PREFIX) return '/';
  if (pathname.startsWith(`${PT_PREFIX}/`)) return pathname.slice(PT_PREFIX.length);
  return null;
}
