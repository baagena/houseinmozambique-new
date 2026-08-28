'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="rounded-[14px] bg-white shadow-2xl border border-[#e5e7eb] p-10">
        <div className="space-y-4 mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#A87A22]">{t.privacy.title}</p>
          <h1 className="text-4xl md:text-5xl font-semibold text-[#13233F] leading-tight">{t.privacy.heading}</h1>
          <p className="text-lg text-[#5E6B7A] max-w-3xl">{t.privacy.intro}</p>
        </div>

        <div className="space-y-8 text-[#5E6B7A]">
          <section className="space-y-3 rounded-[1.75rem] bg-[#F5F2EC] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.privacy.collectTitle}</h2>
            <p>{t.privacy.collectDesc}</p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#F5F2EC] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.privacy.useTitle}</h2>
            <p>{t.privacy.useDesc}</p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#F5F2EC] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.privacy.sharingTitle}</h2>
            <p>{t.privacy.sharingDesc1}</p>
            <p>{t.privacy.sharingDesc2}</p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#F5F2EC] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-semibold text-[#13233F]">{t.privacy.disclaimerTitle}</h2>
            <p>{t.privacy.disclaimerDesc}</p>
          </section>

          <div className="pt-6 border-t border-[#e5e7eb]">
            <Link href="/terms" className="text-sm font-bold text-[#13233F] hover:underline">{t.privacy.readTermsLink}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
