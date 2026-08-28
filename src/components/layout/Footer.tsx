'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

const SOCIALS = [
  {
    href: 'https://www.facebook.com/share/1CQYNNJEAG/?mibextid=wwXIfr',
    label: 'Facebook',
    icon: '/Platform=Facebook,%20Color=Original.svg',
  },
  {
    href: 'https://www.instagram.com/houseinmozambique?igsh=MXZ2eXMwZzBqano3NA%3D%3D&utm_source=qr',
    label: 'Instagram',
    icon: '/Platform=Instagram,%20Color=Original.svg',
  },
  {
    href: 'https://youtube.com/@houseinmozambique?si=ZS5ltZYL65cRMpmU',
    label: 'YouTube',
    icon: '/Platform=YouTube,%20Color=Original.svg',
  },
  {
    href: 'https://www.tiktok.com/@house_in_mozambique?_r=1&_t=ZS-96vgKrmit98',
    label: 'TikTok',
    icon: '/Platform=TikTok,%20Color=Original.svg',
  },
  {
    href: 'https://x.com/ebeb29238037?s=11',
    label: 'X',
    icon: '/Platform=X%20(Twitter),%20Color=Original.svg',
  },
];

export default function Footer() {
  const { t } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = newsletterEmail.trim();
    if (!email) {
      setNewsletterStatus('error');
      setNewsletterMessage(t.footer.newsletterRequired);
      return;
    }

    setNewsletterStatus('submitting');
    setNewsletterMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || t.footer.newsletterError);
      }

      setNewsletterEmail('');
      setNewsletterStatus('success');
      setNewsletterMessage(
        payload.alreadySubscribed
          ? t.footer.newsletterAlreadySubscribed
          : t.footer.newsletterSuccess
      );
    } catch (error) {
      setNewsletterStatus('error');
      setNewsletterMessage(
        error instanceof Error ? error.message : t.footer.newsletterError
      );
    }
  };

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <h4>House in Mozambique</h4>
            <p className="max-w-[42ch] text-[0.9rem] leading-relaxed">{t.footer.brandDesc}</p>
            <div className="socials">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`House in Mozambique on ${s.label}`}
                >
                  <img src={s.icon} alt="" className="h-4 w-4 object-contain" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h5>{t.nav.properties}</h5>
            <ul className="footer-links">
              {[
                { label: t.nav.forSale, href: '/properties?type=Buy' },
                { label: t.nav.forRent, href: '/properties?type=Rent' },
                { label: t.nav.shortStays, href: '/properties?type=Short+Stay' },
                { label: t.nav.auctions, href: '/properties?type=Auction' },
                { label: t.nav.agents, href: '/agents' },
                { label: t.nav.news, href: '/news' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services + contact */}
          <div>
            <h5>{t.footer.getInTouch}</h5>
            <ul className="footer-contact">
              <li>
                <span className="material-symbols-outlined mt-0.5 text-[1rem] text-[var(--gold)]">call</span>
                <a href="tel:+258879329012">+258 879 329 012</a>
              </li>
              <li>
                <span className="material-symbols-outlined mt-0.5 text-[1rem] text-[var(--gold)]">mail</span>
                <a href="mailto:info@houseinmozambique.com" className="break-all">
                  info@houseinmozambique.com
                </a>
              </li>
              <li>
                <span className="material-symbols-outlined mt-0.5 text-[1rem] text-[var(--gold)]">location_on</span>
                <span>Av. Mozambique N1, Maputo — Zimpeto</span>
              </li>
            </ul>
            <ul className="footer-links mt-5">
              {[
                { label: t.footer.propertyRealEstate, href: '/services/property-advertising' },
                { label: t.footer.assessingPictures, href: '/services/property-assessment' },
                { label: t.footer.realEstateAgent, href: '/services/agent-listing' },
                { label: t.footer.contactUs, href: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h5>{t.footer.stayUpdated}</h5>
            <p className="text-[0.9rem] leading-relaxed">{t.footer.newsletterDesc}</p>
            <form className="news" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => {
                  setNewsletterEmail(event.target.value);
                  if (newsletterStatus !== 'submitting') {
                    setNewsletterStatus('idle');
                    setNewsletterMessage('');
                  }
                }}
                placeholder={t.footer.emailPlaceholder}
                aria-label={t.footer.emailPlaceholder}
                disabled={newsletterStatus === 'submitting'}
                required
              />
              <button type="submit" disabled={newsletterStatus === 'submitting'} aria-label={t.footer.subscribe}>
                <span className="material-symbols-outlined text-[1.1rem]">
                  {newsletterStatus === 'submitting' ? 'progress_activity' : 'arrow_forward'}
                </span>
              </button>
            </form>
            {newsletterMessage ? (
              <p
                className={`mono mt-3 text-[0.72rem] leading-relaxed ${
                  newsletterStatus === 'success' ? 'text-[#7fbf95]' : 'text-[#e39b8a]'
                }`}
                role="status"
              >
                {newsletterMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="footer-bottom">
          <p className="mono">{t.footer.copyright}</p>
          <div className="flinks">
            <Link href="/privacy">{t.footer.privacy}</Link>
            <Link href="/terms">{t.footer.terms}</Link>
            <Link href="/pricing">{t.nav.pricing}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
