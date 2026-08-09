'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';
import ServiceLayout from '@/components/services/ServiceLayout';

const BENEFIT_ICONS = ['badge', 'verified', 'space_dashboard', 'forward_to_inbox', 'trending_up'];

export default function AgentListingServiceClient() {
  const { t } = useLanguage();

  const benefits = [
    t.services.agentsGet1,
    t.services.agentsGet2,
    t.services.agentsGet3,
    t.services.agentsGet4,
    t.services.agentsGet5,
  ];
  const steps = [
    t.services.agentsStep1,
    t.services.agentsStep2,
    t.services.agentsStep3,
    t.services.agentsStep4,
  ];

  return (
    <ServiceLayout
      slug="agent-listing"
      primaryHref="/auth/agent-register"
      primaryLabelKey="startNow"
    >
      {/* ── What it is — text beside a profile anatomy card ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#845326]">
              {t.services.whatItIs}
            </p>
            <p className="mt-5 text-xl font-bold leading-relaxed text-[#002045] md:text-2xl">
              {t.services.agentsBody1}
            </p>
            <p className="mt-5 text-base font-medium leading-relaxed text-[#43474e]">
              {t.services.agentsBody2}
            </p>
            <Link
              href="/agents"
              className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#002045]/20 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[#002045] transition-all hover:bg-[#002045]/5"
            >
              {t.nav.agents}
              <span className="material-symbols-outlined text-lg leading-none">arrow_forward</span>
            </Link>
          </div>

          {/* Anatomy of a directory profile */}
          <div className="rounded-[2.5rem] bg-white p-8 shadow-[0_20px_60px_rgba(0,32,69,0.07)]">
            <div className="flex items-center gap-5">
              <span className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-[1.5rem] bg-[#f2f4f6] text-2xl font-black text-[#002045]">
                HM
                <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-4 border-white bg-[#845326]">
                  <span
                    className="material-symbols-outlined text-sm leading-none text-white"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </span>
              </span>
              <div>
                <p className="text-lg font-black leading-tight text-[#002045]">
                  {t.services.profileExample}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#845326]">
                  <span
                    className="material-symbols-outlined text-sm leading-none"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  {t.services.verifiedLabel}
                </p>
              </div>
            </div>

            <ul className="mt-8 space-y-3">
              {['badge', 'location_on', 'workspace_premium', 'home_work'].map((icon, i) => (
                <li key={icon} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg leading-none text-[#c4c6cf]">
                    {icon}
                  </span>
                  <span className="h-2.5 rounded-full bg-[#f2f4f6]" style={{ width: `${70 - i * 12}%` }} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── What you get — tiles on navy ── */}
      <section className="bg-[#002045] py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h2
            className="text-3xl font-black tracking-tight md:text-4xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {t.services.whatYouGet}
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, i) => (
              <div
                key={benefit}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-7 transition-colors hover:border-[#fab983]/40 hover:bg-white/[0.07]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fab983]/15">
                  <span className="material-symbols-outlined text-xl leading-none text-[#fab983]">
                    {BENEFIT_ICONS[i]}
                  </span>
                </span>
                <p className="mt-5 text-sm font-medium leading-relaxed text-white/80">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — numbered chips ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2
          className="text-3xl font-black tracking-tight text-[#002045] md:text-4xl"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          {t.services.howItWorks}
        </h2>

        <ol className="mt-10 grid gap-4 md:grid-cols-2">
          {steps.map((step, i) => (
            <li
              key={step}
              className="flex items-start gap-5 rounded-[1.75rem] bg-white p-7 shadow-sm"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#845326]/10 text-sm font-black text-[#845326]">
                {i + 1}
              </span>
              <p className="pt-1.5 text-sm font-medium leading-relaxed text-[#43474e]">{step}</p>
            </li>
          ))}
        </ol>

        <Link
          href="/auth/agent-register"
          className="mt-12 inline-flex items-center gap-2 rounded-xl bg-[#002045] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[#fab983] transition-all hover:opacity-90 active:scale-95"
        >
          {t.services.startNow}
          <span className="material-symbols-outlined text-lg leading-none">arrow_forward</span>
        </Link>
      </section>
    </ServiceLayout>
  );
}
