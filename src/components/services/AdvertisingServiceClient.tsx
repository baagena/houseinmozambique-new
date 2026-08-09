'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';
import ServiceLayout from '@/components/services/ServiceLayout';

const BENEFIT_ICONS = ['web', 'category', 'star', 'share', 'forward_to_inbox'];

const CATEGORIES = [
  { type: 'Buy', labelKey: 'forSale' },
  { type: 'Rent', labelKey: 'forRent' },
  { type: 'Short Stay', labelKey: 'shortStays' },
  { type: 'Auction', labelKey: 'auctions' },
];

export default function AdvertisingServiceClient() {
  const { t } = useLanguage();

  const benefits = [
    t.services.advGet1,
    t.services.advGet2,
    t.services.advGet3,
    t.services.advGet4,
    t.services.advGet5,
  ];
  const steps = [
    t.services.advStep1,
    t.services.advStep2,
    t.services.advStep3,
    t.services.advStep4,
  ];

  return (
    <ServiceLayout slug="property-advertising" primaryHref="/pricing" primaryLabelKey="pricingCta">
      {/* ── What it is ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#845326]">
              {t.services.whatItIs}
            </p>
            <p className="mt-5 text-xl font-bold leading-relaxed text-[#002045] md:text-2xl">
              {t.services.advBody1}
            </p>
            <p className="mt-5 text-base font-medium leading-relaxed text-[#43474e]">
              {t.services.advBody2}
            </p>
          </div>

          {/* Where the listing ends up */}
          <aside className="rounded-[2rem] border border-[#c4c6cf]/25 bg-white p-8 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#845326]">
              {t.nav.properties}
            </p>
            <div className="mt-5 space-y-2">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.type}
                  href={`/properties?type=${encodeURIComponent(cat.type)}`}
                  className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-[#f7f9fb]"
                >
                  <span className="text-sm font-bold text-[#002045]">{t.nav[cat.labelKey]}</span>
                  <span className="material-symbols-outlined text-lg leading-none text-[#c4c6cf] transition-all group-hover:translate-x-1 group-hover:text-[#845326]">
                    arrow_forward
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-6 border-t border-[#c4c6cf]/20 pt-5 text-xs font-medium italic leading-relaxed text-[#74777f]">
              {t.services.priceNote}
            </p>
          </aside>
        </div>
      </section>

      {/* ── What you get — icon cards ── */}
      <section className="border-y border-[#c4c6cf]/20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2
            className="text-3xl font-black tracking-tight text-[#002045] md:text-4xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {t.services.whatYouGet}
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {benefits.map((benefit, i) => (
              <div
                key={benefit}
                className={`flex items-start gap-5 rounded-[1.75rem] border border-[#c4c6cf]/25 p-7 transition-all hover:border-[#845326]/40 hover:shadow-lg hover:shadow-[#002045]/5 ${
                  i === benefits.length - 1 ? 'md:col-span-2' : ''
                }`}
              >
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#845326]/10">
                  <span className="material-symbols-outlined text-2xl leading-none text-[#845326]">
                    {BENEFIT_ICONS[i]}
                  </span>
                </span>
                <p className="text-base font-medium leading-relaxed text-[#43474e]">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — horizontal timeline ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2
          className="text-3xl font-black tracking-tight text-[#002045] md:text-4xl"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          {t.services.howItWorks}
        </h2>

        <ol className="mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
          {steps.map((step, i) => (
            <li key={step} className="relative">
              {/* connector */}
              {i < steps.length - 1 && (
                <span className="absolute left-12 right-0 top-5 hidden h-px bg-[#c4c6cf]/40 md:block" />
              )}
              <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#002045] text-xs font-black text-[#fab983]">
                {i + 1}
              </span>
              <p className="mt-5 pr-4 text-sm font-medium leading-relaxed text-[#43474e]">{step}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-[#002045] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[#fab983] transition-all hover:opacity-90 active:scale-95"
          >
            {t.services.pricingCta}
            <span className="material-symbols-outlined text-lg leading-none">arrow_forward</span>
          </Link>
          <Link
            href="/post-property"
            className="inline-flex items-center gap-2 rounded-xl border border-[#002045]/20 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[#002045] transition-all hover:bg-[#002045]/5"
          >
            {t.nav.postHouse}
          </Link>
        </div>
      </section>
    </ServiceLayout>
  );
}
