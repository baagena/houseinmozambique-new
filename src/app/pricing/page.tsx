'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAuth } from '@/lib/auth';
import { useLanguage } from '@/components/i18n/LanguageContext';

const VILLA_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuWSUXLzid2u3OTERtIK6qJpnQlbOOhtVc8LqRxn7Hrx7ruVHxYBf8--9D8l6yM3GhgeRVipuoE11QCFta8tp1kWWb90aRa29GOMGpZxetULhNqwHN9tg4DZJDQxxvHeC-Bc3s1qnnRU9xhJbqMu-ghY4452JCSdw7aDslq4hnlZFFAWHbV07Uq3tveepD8WDCZTmpWuIOLlG2eJpCcRD1tC_uwEg4ED4mP7Gc4i8hoQXD_vB7MunEBhDwdlvRjJzo8dR2NdGnUEs';


export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const router = useRouter();
  const { lang, t } = useLanguage();

  const plans = [
    {
      name: lang === 'en' ? 'Standard' : 'Standard',
      price: '$29',
      unit: lang === 'en' ? '/ listing' : '/ anúncio',
      description: lang === 'en' ? 'Perfect for individual homeowners looking for a quick sale.' : 'Perfeito para proprietários individuais que procuram uma venda rápida.',
      features: [
        { label: lang === 'en' ? 'Single Property Listing' : 'Listagem de Imóvel Único', included: true, star: false },
        { label: lang === 'en' ? '15 High-res Photos' : '15 Fotos em Alta Resolução', included: true, star: false },
        { label: lang === 'en' ? 'Featured Listing' : 'Listagem em Destaque', included: false, star: false },
        { label: lang === 'en' ? 'Professional Photography' : 'Fotografia Profissional', included: false, star: false },
      ],
      highlighted: false,
    },
    {
      name: 'Premium',
      price: '$99',
      unit: lang === 'en' ? '/ listing' : '/ anúncio',
      description: lang === 'en' ? 'Our most popular choice for serious sellers and boutiques.' : 'A nossa escolha mais popular para vendedores sérios e boutiques.',
      badge: lang === 'en' ? 'Recommended' : 'Recomendado',
      features: [
        { label: lang === 'en' ? 'Featured Listing (7 Days)' : 'Listagem em Destaque (7 Dias)', included: true, star: true },
        { label: lang === 'en' ? '30 High-res Photos' : '30 Fotos em Alta Resolução', included: true, star: false },
        { label: lang === 'en' ? 'Social Media Promotion' : 'Promoção nas Redes Sociais', included: true, star: false },
        { label: lang === 'en' ? 'Priority Support' : 'Suporte Prioritário', included: true, star: false },
      ],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: lang === 'en' ? 'Contact' : 'Contacto',
      unit: lang === 'en' ? '/ custom' : '/ personalizado',
      description: lang === 'en' ? 'Tailored solutions for real estate agencies and developers.' : 'Soluções sob medida para agências imobiliárias e promotores.',
      features: [
        { label: lang === 'en' ? 'Unlimited Listings' : 'Listagens Ilimitadas', included: true, star: false },
        { label: lang === 'en' ? 'Agent Dashboard & Analytics' : 'Painel de Agente e Analítica', included: true, star: false },
        { label: lang === 'en' ? 'Professional Photography' : 'Fotografia Profissional', included: true, star: false },
        { label: lang === 'en' ? 'Dedicated Account Manager' : 'Gestor de Conta Dedicado', included: true, star: false },
      ],
      highlighted: false,
    },
  ];

  const faqs = [
    {
      q: lang === 'en' ? 'How much does it cost to list?' : 'Quanto custa para publicar?',
      a: lang === 'en' ? 'Listing costs vary based on the tier you select. Our Standard tier starts at $29 per listing.' : 'Os custos de listagem variam com base no nível que selecionar. Nosso nível Standard começa em $29 por anúncio.',
    },
    {
      q: lang === 'en' ? 'How do I contact agents?' : 'Como contacto os agentes?',
      a: lang === 'en' ? 'Each property listing features a dedicated contact module.' : 'Cada listagem de propriedade apresenta um módulo de contacto dedicado.',
    },
    {
      q: lang === 'en' ? 'Can I list multiple properties?' : 'Posso publicar várias propriedades?',
      a: lang === 'en' ? 'Absolutely. Individual owners can purchase single listings.' : 'Com certeza. Os proprietários individuais podem comprar listagens individuais.',
    },
    {
      q: lang === 'en' ? 'What is the curation process?' : 'Qual é o processo de curadoria?',
      a: lang === 'en' ? 'Every listing submitted goes through a quality review.' : 'Cada listagem submetida passa por uma revisão de qualidade.',
    },
  ];

  function handlePlanSelect(planName: string) {
    const slug = planName.toLowerCase();
    const auth = getAuth();
    if (auth.isLoggedIn) {
      router.push(`/post-property?plan=${slug}`);
    } else {
      router.push(`/auth?redirect=/post-property&plan=${slug}`);
    }
  }

  return (
    <div className="pt-20 bg-[#f7f9fb]">
      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden bg-[#f2f4f6]">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          <span className="inline-block py-1 px-4 mb-6 bg-[#845326] text-white rounded-full text-xs font-bold uppercase tracking-widest">
            {t.pricing.heroBadge}
          </span>
          <h1
            className="text-5xl md:text-7xl font-extrabold text-[#191c1e] tracking-tighter mb-8 max-w-4xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {t.pricing.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-[#43474e] max-w-2xl leading-relaxed mb-12">
            {t.pricing.heroSubtitle}
          </p>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#002045]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-48 w-[32rem] h-[32rem] bg-[#845326]/5 rounded-full blur-[100px]" />
      </section>

      {/* Pricing Cards */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col p-8 rounded-xl relative ${
                plan.highlighted
                  ? 'bg-[#002045] text-white shadow-2xl scale-105 z-10'
                  : 'bg-white hover:bg-[#e6e8ea] transition-colors duration-300'
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#845326] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  {plan.badge}
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlighted ? 'text-[#86a0cd]' : 'text-[#43474e]'}`}>
                  {plan.description}
                </p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-extrabold" style={{ fontFamily: 'var(--font-headline)' }}>
                  {plan.price}
                </span>
                <span className={plan.highlighted ? 'text-[#86a0cd]' : 'text-[#43474e]'}>{plan.unit}</span>
              </div>
              <ul className="mb-12 space-y-4 flex-grow">
                {plan.features.map((f) => (
                  <li key={f.label} className={`flex items-center gap-3 text-sm ${!f.included ? 'opacity-40' : ''}`}>
                    <span className={`material-symbols-outlined text-xl ${
                      f.included
                        ? plan.highlighted ? 'text-[#fab983]' : 'text-[#845326]'
                        : 'text-[#74777f]'
                    }`}>
                      {f.included ? (f.star ? 'stars' : 'check_circle') : 'do_not_disturb_on'}
                    </span>
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
              {plan.name === 'Enterprise' ? (
                <a
                  href="/contact"
                  className={`w-full py-4 rounded-lg font-bold text-center block transition-all duration-300 ${
                    plan.highlighted
                      ? 'bg-[#845326] text-white hover:opacity-90'
                      : 'bg-[#e0e3e5] text-[#002045] hover:bg-[#002045] hover:text-white'
                  }`}
                >
                  {t.pricing.contactTeam}
                </a>
              ) : (
                <button
                  onClick={() => handlePlanSelect(plan.name)}
                  className={`w-full py-4 rounded-lg font-bold text-center block transition-all duration-300 ${
                    plan.highlighted
                      ? 'bg-[#845326] text-white hover:opacity-90'
                      : 'bg-[#e0e3e5] text-[#002045] hover:bg-[#002045] hover:text-white'
                  }`}
                >
                  {t.pricing.postHouseBtn}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Why List With Us */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2 relative">
            <div className="aspect-[4/5] bg-[#f2f4f6] rounded-xl overflow-hidden shadow-2xl">
              <Image src={VILLA_IMG} alt="Luxury Villa" fill className="object-cover" />
            </div>
            <div className="absolute -bottom-8 -right-8 w-64 p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-xl hidden md:block border border-[#c4c6cf]/10">
              <h4 className="font-bold text-[#002045] mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
                {t.pricing.exclusiveCuration}
              </h4>
              <p className="text-xs text-[#43474e] leading-relaxed">
                {t.pricing.exclusiveCurationDesc}
              </p>
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <h2
              className="text-4xl font-extrabold text-[#002045] tracking-tight mb-6"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {t.pricing.whyListTitle}
            </h2>
            <div className="space-y-8">
              {[
                { icon: 'visibility', title: t.pricing.highIntentAudience, desc: t.pricing.highIntentAudienceDesc },
                { icon: 'camera_enhance', title: t.pricing.editorialPresentation, desc: t.pricing.editorialPresentationDesc },
                { icon: 'analytics', title: t.pricing.inDepthInsights, desc: t.pricing.inDepthInsightsDesc },
              ].map((item) => (
                <div key={item.title} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#845326]/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#845326]">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1" style={{ fontFamily: 'var(--font-headline)' }}>{item.title}</h4>
                    <p className="text-[#43474e] text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-[#f2f4f6]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-extrabold text-[#002045] mb-4"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {t.pricing.faqTitle}
            </h2>
            <p className="text-[#43474e]">{t.pricing.faqSubtitle}</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden transition-all duration-300">
                <button
                  className="w-full flex items-center justify-between p-6 text-left group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-bold text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
                    {faq.q}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[#43474e] transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-[#43474e] text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
