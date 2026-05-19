'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function NewsPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] bg-white shadow-2xl border border-[#e5e7eb] p-10">
        <div className="flex flex-col gap-3 mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-[#002045] leading-tight">{t.news.title}</h1>
        </div>

        <div className="space-y-8 text-[#43474e]">
          <p className="text-lg font-semibold text-[#002045]">{t.news.introLead}</p>
          <p>{t.news.intro1}</p>
          <p>{t.news.intro2}</p>

          <div className="rounded-[1.75rem] bg-[#f7f9fb] border border-[#e5e7eb] p-8">
            <h2 className="text-2xl font-black text-[#002045] mb-4">{t.news.sectionTitle}</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#002045]">{t.news.expertiseTitle}</h3>
                <p className="mt-2 text-[#43474e]">{t.news.expertiseDesc}</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#002045]">{t.news.advertisementTitle}</h3>
                <p className="mt-2 text-[#43474e]">{t.news.advertisementDesc}</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#002045]">{t.news.photographyTitle}</h3>
                <p className="mt-2 text-[#43474e]">{t.news.photographyDesc}</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#002045]">{t.news.conciergeTitle}</h3>
                <p className="mt-2 text-[#43474e]">{t.news.conciergeDesc}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-[#002045]">{t.news.commitmentTitle}</h2>
            <p>{t.news.commitmentDesc1}</p>
            <p>{t.news.commitmentDesc2}</p>
            <p className="text-lg font-black text-[#002045]">{t.news.commitmentQuote}</p>
          </div>

          <div className="pt-6 border-t border-[#e5e7eb]">
            <Link href="/" className="text-sm font-bold text-[#002045] hover:underline">{t.news.backToHome}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
