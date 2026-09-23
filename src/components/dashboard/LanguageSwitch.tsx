'use client';

/**
 * PT / EN, in the console's top bar.
 *
 * The switch existed only on the marketing header, so an agent who signed in
 * was stuck with whatever language they last chose on the public site and had
 * no way to change it without signing out and going back to the storefront.
 * The console is where they spend their time; the control belongs here too.
 *
 * It writes through the same LanguageProvider as the public switch — one
 * preference, one localStorage key — so changing it here changes it there.
 */

import { useLanguage } from '@/components/i18n/LanguageContext';

const OPTIONS = [
  { value: 'pt' as const, label: 'PT', title: 'Português' },
  { value: 'en' as const, label: 'EN', title: 'English' },
];

export default function LanguageSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <div role="radiogroup" aria-label={lang === 'pt' ? 'Idioma' : 'Language'} className="lang-switch">
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title}
            className={`lang-btn${active ? ' is-on' : ''}`}
            onClick={() => setLang(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
