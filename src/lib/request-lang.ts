import { headers } from 'next/headers';
import type { Language } from '@/lib/translations';
import { LANG_HEADER } from '@/lib/site-lang';

/**
 * The language this request is served in: English under `/en`, Portuguese
 * otherwise. The header is set (and, on every other path, removed) by
 * src/proxy.ts, so a client cannot choose it by sending the header itself.
 */
export async function requestLang(): Promise<Language> {
  const h = await headers();
  return h.get(LANG_HEADER) === 'en' ? 'en' : 'pt';
}
