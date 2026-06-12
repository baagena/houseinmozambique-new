'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

const heroImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1800';

export default function AboutPage() {
  const { t } = useLanguage();

  const services = [
    {
      icon: 'real_estate_agent',
      title: t.news.expertiseTitle,
      desc: t.news.expertiseDesc,
    },
    {
      icon: 'campaign',
      title: t.news.advertisementTitle,
      desc: t.news.advertisementDesc,
    },
    {
      icon: 'photo_camera',
      title: t.news.photographyTitle,
      desc: t.news.photographyDesc,
    },
    {
      icon: 'verified',
      title: t.news.conciergeTitle,
      desc: t.news.conciergeDesc,
    },
  ];

  return (
    <main className="bg-[#f7f9fb]">
      <section className="relative min-h-[620px] overflow-hidden bg-[#002045] px-6 pt-32 text-white">
        <Image src={heroImage} alt="Modern home exterior" fill priority className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-[#002045]/65" />
        <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl flex-col justify-end pb-16">
          <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-[#fab983]">{t.about.title}</p>
          <h1 className="max-w-5xl text-5xl font-black tracking-tight md:text-7xl" style={{ fontFamily: 'var(--font-headline)' }}>
            {t.about.heading}
          </h1>
          <p className="mt-6 max-w-3xl text-lg font-medium leading-relaxed text-white/80">{t.about.desc1}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#845326]">{t.news.title}</p>
            <h2 className="text-4xl font-black tracking-tight text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
              {t.news.introLead}
            </h2>
            <div className="space-y-4 text-base font-medium leading-relaxed text-[#43474e]">
              <p>{t.about.desc2}</p>
              <p>{t.about.desc3}</p>
              <p>{t.news.intro1}</p>
              <p>{t.news.intro2}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-[2rem] bg-white p-7 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#845326]">{t.about.missionTitle}</p>
              <p className="mt-4 text-sm font-medium leading-relaxed text-[#43474e]">{t.about.mission1}</p>
              <p className="mt-4 text-sm font-medium leading-relaxed text-[#43474e]">{t.about.mission2}</p>
            </section>
            <section className="rounded-[2rem] bg-[#002045] p-7 text-white shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#fab983]">{t.about.visionTitle}</p>
              <p className="mt-4 text-sm font-medium leading-relaxed text-white/75">{t.about.vision1}</p>
              <p className="mt-4 text-sm font-medium leading-relaxed text-white/75">{t.about.vision2}</p>
            </section>
          </div>
        </div>

        <div className="mt-20">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#845326]">{t.news.sectionTitle}</p>
              <h2 className="mt-2 text-3xl font-black text-[#002045]">How we serve the market</h2>
            </div>
            <Link href="/pricing" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#002045] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#fab983]">
              {t.nav.postHouse}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <section key={service.title} className="rounded-[2rem] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#002045]/10">
                <span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-2xl bg-[#845326]/10 text-[#845326]">
                  {service.icon}
                </span>
                <h3 className="mt-5 text-lg font-black leading-tight text-[#002045]">{service.title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-[#74777f]">{service.desc}</p>
              </section>
            ))}
          </div>
        </div>

        <section className="mt-20 overflow-hidden rounded-[2rem] bg-[#002045] text-white shadow-sm">
          <div className="grid lg:grid-cols-[1fr_420px]">
            <div className="p-8 md:p-12">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fab983]">{t.news.commitmentTitle}</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl" style={{ fontFamily: 'var(--font-headline)' }}>
                {t.news.commitmentQuote}
              </h2>
              <div className="mt-6 max-w-3xl space-y-4 text-sm font-medium leading-relaxed text-white/75">
                <p>{t.news.commitmentDesc1}</p>
                <p>{t.news.commitmentDesc2}</p>
              </div>
            </div>
            <div className="relative min-h-[320px]">
              <Image
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=900"
                alt="House keys and property documents"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
