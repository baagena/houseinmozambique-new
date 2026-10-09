import type { Language } from '@/lib/translations';

/**
 * Every public page has two addresses: the Portuguese one (`/properties`) and
 * an English one under `/en` (`/en/properties`).
 *
 * The language switch alone only changed the page in the visitor's browser
 * after it loaded, so Google only ever read the Portuguese copy, and an
 * English search had nothing English to match. src/proxy.ts serves `/en/...`
 * by rewriting it onto the same route with LANG_HEADER set, and the root
 * layout renders English from the server.
 */
export const LANG_HEADER = 'x-site-lang';
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
