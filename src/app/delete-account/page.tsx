'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function DeleteAccountPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] bg-white shadow-2xl border border-[#e5e7eb] p-10">
        <div className="space-y-4 mb-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#845326]">{t.deleteAccount.title}</p>
          <h1 className="text-4xl md:text-5xl font-black text-[#002045] leading-tight">{t.deleteAccount.heading}</h1>
          <p className="text-lg text-[#43474e] max-w-3xl">{t.deleteAccount.intro}</p>
        </div>

        <div className="space-y-8 text-[#43474e]">
          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">{t.deleteAccount.howTitle}</h2>
            <p>{t.deleteAccount.howDesc}</p>
            <p className="font-bold text-[#002045]">
              {t.deleteAccount.contactLabel}:{' '}
              <a href="mailto:info@houseinmozambique.com" className="underline">
                info@houseinmozambique.com
              </a>
            </p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">{t.deleteAccount.timelineTitle}</h2>
            <p>{t.deleteAccount.timelineDesc}</p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">{t.deleteAccount.dataTitle}</h2>
            <p>{t.deleteAccount.dataDeletedDesc}</p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">{t.deleteAccount.dataKeptTitle}</h2>
            <p>{t.deleteAccount.dataKeptDesc}</p>
          </section>

          <div className="pt-6 border-t border-[#e5e7eb]">
            <Link href="/privacy" className="text-sm font-bold text-[#002045] hover:underline">
              {t.privacy.title}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
