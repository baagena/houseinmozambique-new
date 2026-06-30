'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Language, translations } from '@/lib/translations';

/** Flat dot-path overrides keyed by language, loaded from the DB CMS. */
export type ContentOverrides = Partial<Record<Language, Record<string, string>>>;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: any; // Type-safety can be improved here
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function setPath(target: Record<string, unknown>, path: string, value: string) {
  const parts = path.split('.');
  let node = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (typeof node[part] !== 'object' || node[part] === null) node[part] = {};
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

/** Deep-merge flat overrides onto a clone of the default translations for a language. */
function applyOverrides(lang: Language, overrides: Record<string, string> | undefined) {
  const base = JSON.parse(JSON.stringify(translations[lang])) as Record<string, unknown>;
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (typeof value === 'string' && value.length > 0) setPath(base, key, value);
    }
  }
  return base;
}

export function LanguageProvider({
  children,
  overrides,
}: {
  children: React.ReactNode;
  overrides?: ContentOverrides;
}) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'pt')) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = useMemo(() => applyOverrides(lang, overrides?.[lang]), [lang, overrides]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
