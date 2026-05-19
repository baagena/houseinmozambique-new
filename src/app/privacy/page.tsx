'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] bg-white shadow-2xl border border-[#e5e7eb] p-10">
        <div className="space-y-4 mb-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#845326]">{t.privacy.title}</p>
          <h1 className="text-4xl md:text-5xl font-black text-[#002045] leading-tight">{t.privacy.heading}</h1>
          <p className="text-lg text-[#43474e] max-w-3xl">{t.privacy.intro}</p>
        </div>

        <div className="space-y-8 text-[#43474e]">
          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">{t.privacy.collectTitle}</h2>
            <p>{t.privacy.collectDesc}</p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">{t.privacy.useTitle}</h2>
            <p>{t.privacy.useDesc}</p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">{t.privacy.sharingTitle}</h2>
            <p>{t.privacy.sharingDesc1}</p>
            <p>{t.privacy.sharingDesc2}</p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">{t.privacy.disclaimerTitle}</h2>
            <p>{t.privacy.disclaimerDesc}</p>
          </section>

          <div className="pt-6 border-t border-[#e5e7eb]">
            <Link href="/terms" className="text-sm font-bold text-[#002045] hover:underline">{t.privacy.readTermsLink}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
