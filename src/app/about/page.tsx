'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] bg-white shadow-2xl border border-[#e5e7eb] p-10">
        <div className="space-y-4 mb-10">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#845326]">{t.about.title}</p>
          <h1 className="text-4xl md:text-5xl font-black text-[#002045] leading-tight">{t.about.heading}</h1>
          <p className="text-lg text-[#43474e] max-w-3xl">{t.about.desc1}</p>
        </div>

        <div className="space-y-10 text-[#43474e]">
          <div className="space-y-4">
            <p>{t.about.desc2}</p>
            <p>{t.about.desc3}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
              <h2 className="text-xl font-black text-[#002045] mb-4">{t.about.missionTitle}</h2>
              <p>{t.about.mission1}</p>
              <p className="mt-4">{t.about.mission2}</p>
            </section>
            <section className="rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
              <h2 className="text-xl font-black text-[#002045] mb-4">{t.about.visionTitle}</h2>
              <p>{t.about.vision1}</p>
              <p className="mt-4">{t.about.vision2}</p>
            </section>
          </div>

          <div className="pt-6 border-t border-[#e5e7eb]">
            <Link href="/" className="text-sm font-bold text-[#002045] hover:underline">{t.about.backToHome}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
