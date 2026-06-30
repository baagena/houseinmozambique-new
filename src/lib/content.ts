import { prisma } from './db';
import { translations, type Language } from './translations';

export type FlatContent = Record<string, string>;
export type ContentOverrides = Record<Language, FlatContent>;

/**
 * Recursively flatten a nested translations object into dot-path keyed strings.
 * Only string leaves are included (the translations object has no arrays).
 */
export function flattenContent(obj: unknown, prefix = ''): FlatContent {
  const out: FlatContent = {};
  if (obj == null || typeof obj !== 'object') return out;

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out[path] = value;
    } else if (value && typeof value === 'object') {
      Object.assign(out, flattenContent(value, path));
    }
  }
  return out;
}

/** Set a dot-path key onto a (mutable) nested object, creating objects as needed. */
function setPath(target: Record<string, unknown>, path: string, value: string) {
  const parts = path.split('.');
  let node = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (typeof node[part] !== 'object' || node[part] === null) {
      node[part] = {};
    }
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

/** Deep clone a plain JSON-ish object. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Merge a flat overrides map onto a deep clone of the default translations
 * for a single language. Unknown/empty overrides are ignored so the site
 * always falls back to the in-code defaults.
 */
export function mergeOverrides(lang: Language, overrides: FlatContent): Record<string, unknown> {
  const base = clone(translations[lang]) as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'string' && value.length > 0) {
      setPath(base, key, value);
    }
  }
  return base;
}

/**
 * Load all content overrides from the database, grouped by language as flat
 * dot-path maps. Returns empty maps (never throws) if the table is unreachable
 * so the public site keeps rendering the in-code defaults.
 */
export async function getContentOverrides(): Promise<ContentOverrides> {
  const empty: ContentOverrides = { en: {}, pt: {} };
  try {
    const rows = await prisma.siteContent.findMany({
      select: { key: true, lang: true, value: true },
    });
    for (const row of rows) {
      const lang = row.lang === 'pt' ? 'pt' : 'en';
      empty[lang][row.key] = row.value;
    }
    return empty;
  } catch (error) {
    console.error('getContentOverrides: failed to load site content', error);
    return empty;
  }
}

/** The full default content as flat maps — used by the admin editor for fallbacks. */
export const defaultFlatContent: ContentOverrides = {
  en: flattenContent(translations.en),
  pt: flattenContent(translations.pt),
};
