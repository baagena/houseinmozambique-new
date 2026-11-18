'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/components/i18n/LanguageContext';

/*
 * Shown in place of a page that could not be rendered, almost always because
 * its data could not be read. It sits inside the layout, so the menu, the
 * footer and the links to every other page stay where they are.
 *
 * The copy is written here, not taken from the translations: this is the page
 * for when things are broken, and it should need nothing that can break.
 */
const COPY = {
  pt: {
    eyebrow: 'Temporariamente indisponível',
    heading: 'Não foi possível carregar esta página',
    body: 'Estamos com dificuldades em obter os dados neste momento. O resto do site continua a funcionar. Tente novamente dentro de instantes.',
    retry: 'Tentar novamente',
    home: 'Página inicial',
    contact: 'Contactar-nos',
  },
  en: {
    eyebrow: 'Temporarily unavailable',
    heading: 'This page could not be loaded',
    body: 'We are having trouble reaching our data right now. The rest of the site still works. Please try again in a moment.',
    retry: 'Try again',
    home: 'Home page',
    contact: 'Contact us',
  },
};

export default function PageError({ error, retry }: { error: unknown; retry: () => void }) {
  const { lang } = useLanguage();
  const copy = COPY[lang === 'en' ? 'en' : 'pt'];
  const prefix = lang === 'en' ? '/en' : '';

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <div className="rounded-[14px] bg-white shadow-2xl border border-[#e5e7eb] p-10 text-center" role="alert">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#A87A22]">{copy.eyebrow}</p>
        <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-[#13233F] leading-tight">{copy.heading}</h1>
        <p className="mt-4 text-lg text-[#5E6B7A]">{copy.body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-full bg-[#13233F] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            {copy.retry}
          </button>
          {/* Plain links: a full page load, not a client transition into the same failure. */}
          <a
            href={prefix || '/'}
            className="rounded-full border border-[#e5e7eb] px-6 py-3 text-sm font-semibold text-[#13233F] hover:bg-[#f7f7f5]"
          >
            {copy.home}
          </a>
          <a
            href={`${prefix}/contact`}
            className="rounded-full border border-[#e5e7eb] px-6 py-3 text-sm font-semibold text-[#13233F] hover:bg-[#f7f7f5]"
          >
            {copy.contact}
          </a>
        </div>
      </div>
    </div>
  );
}
