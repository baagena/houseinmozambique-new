'use client';

import Link from 'next/link';
import PropertyCard from '@/components/properties/PropertyCard';
import CategoryCarousel from '@/components/properties/CategoryCarousel';
import HomeHero from '@/components/home/HomeHero';
import AgentCarousel from '@/components/home/AgentCarousel';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface HomeClientProps {
  featured: any[];
  featuredAgents: any[];
  maputoProps: any[];
  inhamProps: any[];
  beiraProps: any[];
  nampulaProps: any[];
  teteProps: any[];
  pembaProps: any[];
  rentProps: any[];
  buyProps: any[];
  shortStayProps: any[];
}

export default function HomeClient({
  featured,
  featuredAgents,
  maputoProps,
  inhamProps,
  beiraProps,
  nampulaProps,
  teteProps,
  pembaProps,
  rentProps,
  buyProps,
  shortStayProps,
}: HomeClientProps) {
  const { t } = useLanguage();

  return (
    <>
      <HomeHero />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <AgentCarousel agents={featuredAgents} />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-24 pb-24">

        {/* ── Featured Collection ── */}
        <CategoryCarousel
          title={t.home.featuredCollection}
          badge={t.home.curatedPicks}
          properties={featured}
          seeAllUrl="/properties?isFeatured=true"
          subtitle={t.home.featuredSubtitle}
        />

        {/* ── Explore by Location ── */}
        <div className="space-y-24">
          <section className="space-y-24">
            {maputoProps.length > 0 && (
              <CategoryCarousel
                title={t.home.maputoTitle}
                properties={maputoProps}
                seeAllUrl="/properties?location=Maputo"
                subtitle={t.home.maputoSubtitle}
              />
            )}

            {beiraProps.length > 0 && (
              <CategoryCarousel
                title={t.home.beiraTitle}
                properties={beiraProps}
                seeAllUrl="/properties?location=Beira"
                subtitle={t.home.beiraSubtitle}
              />
            )}

            {nampulaProps.length > 0 && (
              <CategoryCarousel
                title={t.home.nampulaTitle}
                properties={nampulaProps}
                seeAllUrl="/properties?location=Nampula"
                subtitle={t.home.nampulaSubtitle}
              />
            )}

            {teteProps.length > 0 && (
              <CategoryCarousel
                title={t.home.teteTitle}
                properties={teteProps}
                seeAllUrl="/properties?location=Tete"
                subtitle={t.home.teteSubtitle}
              />
            )}

            {pembaProps.length > 0 && (
              <CategoryCarousel
                title={t.home.pembaTitle}
                properties={pembaProps}
                seeAllUrl="/properties?location=Pemba"
                subtitle={t.home.pembaSubtitle}
              />
            )}
          </section>

          {/* Inhambane Grid */}
          {inhamProps.length > 0 && (
            <div className="space-y-8 pb-12">
              <Link href="/properties?location=Inhambane" className="flex items-center gap-2 group cursor-pointer w-fit">
                <h3 className="text-2xl font-bold text-[#191c1e]">
                  {t.home.inhambaneTitle}
                </h3>
                <span className="material-symbols-outlined text-[#43474e] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
              <p className="text-[#43474e] -mt-6 text-sm">{t.home.inhambaneSubtitle}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {inhamProps.slice(0, 4).map((p) => (
                  <PropertyCard key={p.id} property={p as any} hideLocation={true} />
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Quick Lists ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-[#c4c6cf]/20">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold border-l-4 border-[#002045] pl-4">
              {t.nav.rent}
            </h3>
            <div className="h-[480px] overflow-y-auto pr-4 custom-scrollbar space-y-4">
              {rentProps.map((p) => (
                <PropertyCard key={p.id} property={p as any} variant="compact" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold border-l-4 border-[#845326] pl-4">
              {t.nav.buy}
            </h3>
            <div className="h-[480px] overflow-y-auto pr-4 custom-scrollbar space-y-4">
              {buyProps.map((p) => (
                <PropertyCard key={p.id} property={p as any} variant="compact" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold border-l-4 border-[#480600] pl-4">
              {t.nav.shortStay}
            </h3>
            <div className="h-[480px] overflow-y-auto pr-4 custom-scrollbar space-y-4">
              {shortStayProps.map((p) => (
                <PropertyCard key={p.id} property={p as any} variant="compact" />
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <section className="relative rounded-[3rem] overflow-hidden bg-[#1a365d] text-white p-12 md:p-20">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              {t.home.agentCtaTitle}
            </h2>
            <p className="text-xl text-[#86a0cd] mb-10 leading-relaxed">
              {t.home.agentCtaDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/post-property"
                className="bg-[#845326] text-white px-8 py-4 rounded-xl font-extrabold text-lg shadow-xl hover:-translate-y-0.5 transition-all inline-block text-center"
              >
                {t.home.listPropertyBtn}
              </Link>
              <Link
                href="/agents"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-extrabold text-lg hover:bg-white/20 transition-all inline-block text-center"
              >
                {t.home.partnerWithUsBtn}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
