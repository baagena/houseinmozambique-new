'use client';

import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import { useLanguage } from '@/components/i18n/LanguageContext';
import ServiceLayout from '@/components/services/ServiceLayout';

const SHOT_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200';

export default function AssessmentServiceClient() {
  const { t } = useLanguage();

  const deliverables = [
    t.services.shootGet1,
    t.services.shootGet2,
    t.services.shootGet3,
    t.services.shootGet4,
    t.services.shootGet5,
  ];
  const steps = [
    t.services.shootStep1,
    t.services.shootStep2,
    t.services.shootStep3,
    t.services.shootStep4,
  ];

  return (
    <ServiceLayout slug="property-assessment" primaryHref="/contact" primaryLabelKey="talkToUs">
      {/* ── What it is — text beside a reference frame ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A87A22]">
              {t.services.whatItIs}
            </p>
            <p className="lead mt-4 max-w-[46ch] text-[var(--ink)]">
              {t.services.shootBody1}
            </p>
            <p className="mt-4 max-w-[54ch] text-[0.95rem] leading-relaxed text-[#5E6B7A]">
              {t.services.shootBody2}
            </p>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] shadow-2xl shadow-[#13233F]/10">
            <SafeImage
              src={SHOT_IMAGE}
              alt="Interior photographed for a property listing"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 560px"
            />
          </div>
        </div>
      </section>

      {/* ── What you get — numbered rows ── */}
      <section className="border-y border-[#E6E1D6]/20 bg-white py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2
            className="text-3xl font-semibold tracking-tight text-[#13233F] md:text-4xl"
            style={{ fontFamily: 'var(--serif)' }}
          >
            {t.services.whatYouGet}
          </h2>

          <ul className="mt-10">
            {deliverables.map((item, i) => (
              <li
                key={item}
                className="group flex items-baseline gap-6 border-t border-[#E6E1D6]/25 py-7 last:border-b md:gap-10"
              >
                <span className="w-10 flex-shrink-0 text-2xl font-semibold tabular-nums text-[#E6E1D6] transition-colors group-hover:text-[#A87A22]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-base font-medium leading-relaxed text-[#5E6B7A] md:text-lg">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How it works — vertical stepper on navy ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="overflow-hidden rounded-[14px] bg-[#13233F] p-8 text-white md:p-14">
          <h2
            className="text-3xl font-semibold tracking-tight md:text-4xl"
            style={{ fontFamily: 'var(--serif)' }}
          >
            {t.services.howItWorks}
          </h2>

          <ol className="mt-10 max-w-3xl">
            {steps.map((step, i) => (
              <li key={step} className="relative flex gap-6 pb-9 last:pb-0">
                {/* vertical connector */}
                {i < steps.length - 1 && (
                  <span className="absolute bottom-2 left-[19px] top-11 w-px bg-white/15" />
                )}
                <span className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold text-[#e9c877]">
                  {i + 1}
                </span>
                <p className="pt-2 text-base font-medium leading-relaxed text-white/80">{step}</p>
              </li>
            ))}
          </ol>

          <Link
            href="/contact"
            className="mt-12 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#13233F] transition-all hover:opacity-90 active:scale-95"
          >
            {t.services.talkToUs}
            <span className="material-symbols-outlined text-lg leading-none">arrow_forward</span>
          </Link>
        </div>
      </section>
    </ServiceLayout>
  );
}
