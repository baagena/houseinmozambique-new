'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="rounded-[14px] bg-white shadow-2xl border border-[#e5e7eb] p-10">
        <div className="space-y-4 mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#A87A22]">{t.terms.title}</p>
          <h1 className="text-4xl md:text-5xl font-semibold text-[#13233F] leading-tight">{t.terms.heading}</h1>
          <p className="text-lg text-[#5E6B7A] max-w-3xl">{t.terms.subtitle}</p>
        </div>

        <div className="space-y-8 text-[#5E6B7A]">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.acceptanceTitle}</h2>
            <p>{t.terms.acceptanceDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.eligibilityTitle}</h2>
            <p>{t.terms.eligibilityDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.servicesTitle}</h2>
            <p>{t.terms.servicesDesc1}</p>
            <p>{t.terms.servicesDesc2}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.accountsTitle}</h2>
            <p>{t.terms.accountsDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.listingsTitle}</h2>
            <p>{t.terms.listingsDesc1}</p>
            <p>{t.terms.listingsDesc2}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.restrictionsTitle}</h2>
            <p>{t.terms.restrictionsDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.ipTitle}</h2>
            <p>{t.terms.ipDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.thirdPartyTitle}</h2>
            <p>{t.terms.thirdPartyDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.paymentsTitle}</h2>
            <p>{t.terms.paymentsDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.disclaimerTitle}</h2>
            <p>{t.terms.disclaimerDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.liabilityTitle}</h2>
            <p>{t.terms.liabilityDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.indemnificationTitle}</h2>
            <p>{t.terms.indemnificationDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.lawTitle}</h2>
            <p>{t.terms.lawDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.changesTitle}</h2>
            <p>{t.terms.changesDesc}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.terms.contactTitle}</h2>
            <p>{t.terms.contactDesc1}</p>
            <p>{t.terms.contactDesc2}</p>
          </section>

          <div className="pt-6 border-t border-[#e5e7eb]">
            <Link href="/privacy" className="text-sm font-bold text-[#13233F] hover:underline">{t.terms.readPrivacyPolicy}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
