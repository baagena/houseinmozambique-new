'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { SERVICES, serviceHref } from '@/components/services/catalog';

const heroImage =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1800';

export default function ServicesIndexClient() {
  const { t } = useLanguage();

  return (
    <main className="bg-[#f7f9fb]">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#002045] px-6 pt-32 text-white">
        <Image src={heroImage} alt="" aria-hidden fill priority className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#002045] via-[#002045]/90 to-[#002045]/55" />
        <div className="relative z-10 mx-auto max-w-6xl pb-24">
          <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-[#fab983]">
            {t.services.badge}
          </p>
          <h1
            className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {t.services.heading}
          </h1>
          <p className="mt-6 max-w-3xl text-base font-medium leading-relaxed text-white/75 md:text-lg">
            {t.services.lead}
          </p>
        </div>
      </section>

      {/* ── The three services ── */}
      <section className="mx-auto -mt-12 max-w-6xl px-6 pb-24">
        <div className="space-y-6">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              href={serviceHref(service.slug)}
              className="group grid overflow-hidden rounded-[2.5rem] bg-white shadow-[0_16px_48px_rgba(0,32,69,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,32,69,0.12)] md:grid-cols-[280px_1fr]"
            >
              {/* Image panel */}
              <div className="relative min-h-[180px] overflow-hidden bg-[#002045]">
                <Image
                  src={service.image}
                  alt=""
                  aria-hidden
                  fill
                  className="object-cover opacity-55 transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 280px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#002045]/80 to-transparent" />
                <span className="absolute left-7 top-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-2xl leading-none text-[#fab983]">
                    {service.icon}
                  </span>
                </span>
                <span
                  className="absolute bottom-5 left-7 text-5xl font-black leading-none text-white/25"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  {String(service.index).padStart(2, '0')}
                </span>
              </div>

              {/* Text panel */}
              <div className="flex flex-col justify-center p-8 md:p-10">
                <h2
                  className="text-2xl font-black leading-tight tracking-tight text-[#002045] md:text-3xl"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  {t.services[service.titleKey]}
                </h2>
                <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-[#43474e]">
                  {t.services[service.taglineKey]}
                </p>
                <span className="mt-7 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#845326]">
                  {t.services.exploreService}
                  <span className="material-symbols-outlined text-base leading-none transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Closing CTA ── */}
        <section className="mt-16 overflow-hidden rounded-[2.5rem] bg-[#002045] p-8 text-white md:p-14">
          <h2
            className="max-w-3xl text-3xl font-black tracking-tight md:text-4xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {t.services.contactTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/75">
            {t.services.contactDesc}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[#002045] transition-all hover:opacity-90 active:scale-95"
            >
              {t.services.contactCta}
              <span className="material-symbols-outlined text-lg leading-none">arrow_forward</span>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10"
            >
              {t.services.pricingCta}
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
