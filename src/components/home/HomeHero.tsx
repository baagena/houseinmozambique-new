'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

const HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBnVQfCtu9Dd90Gdaa2jDdkQ2z_Xeq6krQV6VJSeeyr13PvW80MmDQcH-QeJC6-1GKkzV5nE8eC-oB960jNWV5NYzaMhoQgOBB_ED4LDUKHYjKwZsumdyys8aRuChvRvDjuHfbLGt1QSdJYKQAeL8abuA-5Ig01BoaOcMtiY0uz_ScZ6QCDlYyJ86LBji7ohI7-8f8rVevJejxSG_Ix29FhghbOU5HOZO5N5eNnpEQybQLaXXWyNNLP6GDDoAs0pkHE0QaBbHYyynY';

export default function HomeHero({ hasTopBanner }: { hasTopBanner?: boolean }) {
  const { t } = useLanguage();

  return (
    <section className={`px-4 md:px-8 relative ${hasTopBanner ? 'mb-12 pt-4' : 'mb-16 pt-24'}`}>
      <div className={`max-w-7xl mx-auto relative rounded-[3rem] overflow-hidden flex items-center justify-center text-center transition-all ${
        hasTopBanner ? 'min-h-[420px] md:min-h-[480px]' : 'min-h-[500px] md:min-h-[600px]'
      }`}>
        <div className="absolute inset-0 z-0 scale-105 hover:scale-100 transition-transform duration-1000">
          <Image src={HERO_IMG} alt="Luxury Villa in Mozambique" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-[#002045]/60 via-[#002045]/40 to-transparent" />
        </div>
        
        <div className={`relative z-10 px-6 max-w-4xl w-full transition-all ${hasTopBanner ? 'pb-14' : 'pb-20'}`}>
          <span className={`inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black tracking-[0.3em] uppercase animate-fade-in ${
            hasTopBanner ? 'mb-5' : 'mb-8'
          }`}>
            {t.home.heroBadge}
          </span>
          <h1 className={`font-black text-white leading-[0.95] tracking-tighter ${
            hasTopBanner ? 'text-4xl md:text-6xl mb-6' : 'text-5xl md:text-8xl mb-8'
          }`} style={{ fontFamily: 'var(--font-headline)' }}>
            {t.home.heroTitle}
          </h1>
          <p className="text-white/80 text-base md:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            {t.home.heroSubtitle}
          </p>
        </div>
      </div>

      {/* ── Search Bar Wrapper ── */}
      <div className="max-w-6xl mx-auto -mt-16 md:-mt-20 relative z-20 px-4">
        <div className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,32,69,0.15)] p-3 md:p-4 border border-white">
          <nav className="bg-[#f2f4f6] rounded-2xl p-1.5 grid grid-cols-2 lg:grid-cols-4 gap-1.5">
            {[
              { label: t.nav.buy, value: 'Buy' },
              { label: t.nav.rent, value: 'Rent' },
              { label: t.nav.shortStay, value: 'Short Stay' },
              { label: t.nav.auction, value: 'Auction' },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={`/properties?type=${encodeURIComponent(opt.value)}`}
                className="flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-center text-xs font-black uppercase tracking-widest text-[#43474e] transition-all duration-300 hover:bg-white hover:text-[#002045] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002045]/20"
              >
                {opt.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
