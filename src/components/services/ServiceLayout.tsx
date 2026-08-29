'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { SERVICES, getService, serviceHref } from '@/components/services/catalog';

/**
 * Shared chrome for a single service page: hero, breadcrumb, and the
 * "other services" / closing CTA footer. The body of each page is passed
 * as children and is laid out differently per service on purpose.
 */
export default function ServiceLayout({
  slug,
  children,
  primaryHref,
  primaryLabelKey,
}: {
  slug: string;
  children: ReactNode;
  primaryHref: string;
  primaryLabelKey: 'startNow' | 'talkToUs' | 'pricingCta';
}) {
  const { t } = useLanguage();
  const service = getService(slug);
  const others = SERVICES.filter((entry) => entry.slug !== slug);

  // The secondary CTA complements the primary rather than restating it.
  const secondary =
    primaryLabelKey === 'talkToUs'
      ? { href: '/pricing', label: t.services.pricingCta }
      : { href: '/contact', label: t.services.talkToUs };

  return (
    <>
      {/* ── Hero ── */}
      <header className="page-hero">
        <div className="page-hero__bg">
          <SafeImage src={service.image} alt="" aria-hidden fill priority className="object-cover" sizes="100vw" />
        </div>
        <div className="wrap">
          <nav className="crumbs pt-0" aria-label="Breadcrumb">
            <Link href="/">{t.nav.home}</Link> / <Link href="/services">{t.nav.services}</Link> /{' '}
            <span style={{ color: '#e9c877' }}>
              {t.services.serviceNumber} {String(service.index).padStart(2, '0')}
            </span>
          </nav>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:gap-6 md:gap-7">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-[12px] border border-white/15 bg-white/10 md:h-12 md:w-12">
              <span className="material-symbols-outlined text-[1.2rem] text-[#e9c877]">{service.icon}</span>
            </span>
            <div className="min-w-0">
              <h1>{t.services[service.titleKey]}</h1>
              <p>{t.services[service.taglineKey]}</p>

              <div className="hero-cta">
                <Link href={primaryHref} className="btn btn--gold">
                  {t.services[primaryLabelKey]}
                  <span className="material-symbols-outlined text-[1.1rem]">arrow_forward</span>
                </Link>
                {/* Never repeat the primary label — pick the action it isn't. */}
                <Link href={secondary.href} className="btn btn--ghost-l">
                  {secondary.label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {children}

      {/* ── Other services ── */}
      <section className="section pt0">
        <div className="wrap">
          <div className="section-title-row">
            <h2>{t.services.otherServices}</h2>
            <Link href="/services">{t.services.allServices} →</Link>
          </div>

          <div className="two-cards">
            {others.map((entry) => (
              <Link key={entry.slug} href={serviceHref(entry.slug)} className="mv group flex gap-5">
                <span className="grid h-12 w-12 flex-none place-items-center rounded-[12px] bg-[var(--paper)] text-[var(--gold-deep)]">
                  <span className="material-symbols-outlined text-[1.15rem]">{entry.icon}</span>
                </span>
                <span>
                  <span className="h-ui block text-[var(--ink)]">{t.services[entry.titleKey]}</span>
                  <span className="muted mt-2 block text-[0.88rem] leading-relaxed">
                    {t.services[entry.taglineKey]}
                  </span>
                  <span className="mono mt-4 inline-flex items-center gap-1 text-[0.7rem] uppercase tracking-[0.1em] text-[var(--gold-deep)]">
                    {t.services.exploreService}
                    <span className="material-symbols-outlined text-[0.95rem] transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
