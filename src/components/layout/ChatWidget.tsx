'use client';

/**
 * A WhatsApp button, on the few pages where a visitor is deciding whether to
 * get in touch.
 *
 * This was a Tidio launcher on every public page. Two problems with that. It
 * loads a third-party script and a fixed-position iframe on a connection where
 * around 1 GB of mobile data costs roughly 1.3% of GNI per capita — and it sat
 * over the content everywhere, including pages that already carry their own
 * contact controls.
 *
 * WhatsApp is how this market actually makes first contact, it costs one link
 * and no script, and it opens in the app the visitor already has.
 */

import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/i18n/LanguageContext';
import Icon from '@/components/ui/Icon';

/**
 * The number the button opens. Digits only — wa.me rejects spaces and plus.
 *
 * `NEXT_PUBLIC_WHATSAPP` overrides it per environment; the fallback is the
 * number already published in the footer and on the contact page, so the
 * button cannot point somewhere nobody answers.
 */
const NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP || '258879329012').replace(/\D/g, '');

/**
 * ONLY the front pages, matched exactly.
 *
 * A floating button belongs where somebody is still deciding whether to talk
 * to us. It does not belong on:
 *   · a property page, which already has WhatsApp, call and enquiry buttons
 *     and a sticky price bar on mobile that it would sit on top of;
 *   · the dashboard, where it covers real controls;
 *   · auth and the listing wizard, where the visitor is mid-task.
 *
 * An allow-list rather than a deny-list, so a page added later is quiet by
 * default and has to opt in — which is the way round that keeps this from
 * creeping back onto everything.
 */
const SHOW_ON = new Set([
  '/',
  '/properties',
  '/agents',
  '/about',
  '/contact',
  '/services',
  '/pricing',
]);

export default function ChatWidget() {
  const pathname = usePathname() || '/';
  const { lang } = useLanguage();
  const pt = lang === 'pt';

  // Exact match: /properties shows it, /properties/some-listing does not.
  if (!SHOW_ON.has(pathname.replace(/\/$/, '') || '/')) return null;

  const message = pt
    ? 'Olá! Vi o House in Mozambique e queria saber mais.'
    : 'Hello! I saw House in Mozambique and would like to know more.';

  return (
    <a
      className="wa-fab"
      href={`https://wa.me/${NUMBER}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={pt ? 'Falar connosco no WhatsApp' : 'Message us on WhatsApp'}
    >
      <Icon name="chat" size={20} />
      <span>{pt ? 'WhatsApp' : 'WhatsApp'}</span>
    </a>
  );
}
