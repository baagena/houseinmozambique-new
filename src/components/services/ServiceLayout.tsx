'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

  return (
    <main className="bg-[#f7f9fb]">
      {/* ── Hero ── */}
      <header className="relative overflow-hidden bg-[#002045] px-6 pt-28 text-white">
        <Image
          src={service.image}
          alt=""
          aria-hidden
          fill
          priority
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#002045] via-[#002045]/90 to-[#002045]/60" />

        <div className="relative z-10 mx-auto max-w-6xl pb-16">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            <Link href="/" className="transition-colors hover:text-white">
              {t.nav.home}
            </Link>
            <span>/</span>
            <Link href="/services" className="transition-colors hover:text-white">
              {t.nav.services}
            </Link>
            <span>/</span>
            <span className="text-[#fab983]">
              {t.services.serviceNumber} {String(service.index).padStart(2, '0')}
            </span>
          </nav>

          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-white/10 backdrop-blur-sm">
              <span className="material-symbols-outlined text-[32px] leading-none text-[#fab983]">
                {service.icon}
              </span>
            </span>
            <div>
              <h1
                className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {t.services[service.titleKey]}
              </h1>
              <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/75 md:text-lg">
                {t.services[service.taglineKey]}
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[#002045] transition-all hover:opacity-90 active:scale-95"
                >
                  {t.services[primaryLabelKey]}
                  <span className="material-symbols-outlined text-lg leading-none">
                    arrow_forward
                  </span>
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10"
                >
                  {t.services.talkToUs}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {children}

      {/* ── Other services ── */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-[#002045]">
            {t.services.otherServices}
          </h2>
          <Link
            href="/services"
            className="flex-shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-[#845326] hover:underline"
          >
            {t.services.allServices}
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {others.map((entry) => (
            <Link
              key={entry.slug}
              href={serviceHref(entry.slug)}
              className="group flex items-start gap-5 rounded-[2rem] bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#002045]/10"
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#845326]/10">
                <span className="material-symbols-outlined text-2xl leading-none text-[#845326]">
                  {entry.icon}
                </span>
              </span>
              <span>
                <span className="block text-lg font-black leading-tight text-[#002045]">
                  {t.services[entry.titleKey]}
                </span>
                <span className="mt-2 block text-sm font-medium leading-relaxed text-[#74777f]">
                  {t.services[entry.taglineKey]}
                </span>
                <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#845326]">
                  {t.services.exploreService}
                  <span className="material-symbols-outlined text-sm leading-none transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
