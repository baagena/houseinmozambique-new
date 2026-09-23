'use client';

import { useLanguage } from '@/components/i18n/LanguageContext';

/**
 * The page's own words, in the reader's language.
 *
 * Split from the server page because the language lives in a client context,
 * and a heading in English above a form in Portuguese is exactly the seam
 * users notice.
 */
export default function PropertyRequestHead() {
  const { t } = useLanguage();
  const c = t.propertyRequest;
  return (
    <header className="prq-head">
      <p className="eyebrow">{c.eyebrow}</p>
      <h1>{c.heading}</h1>
      <p>{c.intro}</p>
    </header>
  );
}
