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
      name: lang === 'en' ? 'Standard (Free)' : 'Standard (Grátis)',
      price: 'Grátis',
      unit: '',
      type: 'standard',
      description: lang === 'en' ? 'Perfect for individual homeowners looking to populate initial inventory.' : 'Perfeito para proprietários individuais que procuram listar seu imóvel.',
      features: [
        { label: lang === 'en' ? '1 Free Property Listing' : '1 Listagem de Imóvel Grátis', included: true, star: false },
        { label: lang === 'en' ? '15 High-res Photos' : '15 Fotos em Alta Resolução', included: true, star: false },
        { label: lang === 'en' ? 'Basic Property Information' : 'Informações Básicas do Imóvel', included: true, star: false },
        { label: lang === 'en' ? 'Email Support' : 'Suporte por Email', included: true, star: false },
        { label: lang === 'en' ? 'Featured Listing' : 'Listagem em Destaque', included: false, star: false },
        { label: lang === 'en' ? 'Analytics Dashboard' : 'Painel de Análise', included: false, star: false },
      ],
      highlighted: false,
      cta: lang === 'en' ? 'List Now' : 'Publicar Agora',
    },
    {
      name: lang === 'en' ? 'Premium' : 'Premium',
      price: '3,000 - 5,000',
      unit: lang === 'en' ? 'Mt / month' : 'Mt / mês',
      type: 'premium',
      description: lang === 'en' ? 'For small real estate agencies wanting to establish their presence.' : 'Para pequenas agências imobiliárias que querem estabelecer sua presença.',
      badge: lang === 'en' ? 'Popular' : 'Popular',
      features: [
        { label: lang === 'en' ? 'Up to 15 Listings' : 'Até 15 Anúncios', included: true, star: true },
        { label: lang === 'en' ? 'Featured Exposure (7 Days)' : 'Exposição em Destaque (7 Dias)', included: true, star: true },
        { label: lang === 'en' ? '30 Photos per Property' : '30 Fotos por Imóvel', included: true, star: false },
        { label: lang === 'en' ? 'Social Media Promotion' : 'Promoção nas Redes Sociais', included: true, star: false },
        { label: lang === 'en' ? 'Priority Email Support' : 'Suporte Prioritário', included: true, star: false },
        { label: lang === 'en' ? 'Basic Analytics' : 'Análise Básica', included: true, star: false },
      ],
      highlighted: true,
      cta: lang === 'en' ? 'Get Started' : 'Começar',
    },
    {
      name: lang === 'en' ? 'Agency Pro' : 'Pro Agência',
      price: '1,500 - 2,500',
      unit: lang === 'en' ? 'Mt / month' : 'Mt / mês',
      type: 'pro',
      description: lang === 'en' ? 'Enterprise-grade solutions for established real estate agencies.' : 'Soluções para agências imobiliárias estabelecidas.',
      features: [
        { label: lang === 'en' ? 'Unlimited Listings' : 'Anúncios Ilimitados', included: true, star: false },
        { label: lang === 'en' ? 'Premium Placement & CRM' : 'CRM Integrado', included: true, star: false },
        { label: lang === 'en' ? 'Unlimited Photos' : 'Fotos Ilimitadas', included: true, star: false },
        { label: lang === 'en' ? 'Advanced Analytics & Reporting' : 'Análise Avançada', included: true, star: false },
        { label: lang === 'en' ? 'Dedicated Account Manager' : 'Gestor de Conta Dedicado', included: true, star: false },
        { label: lang === 'en' ? 'Priority Phone Support' : 'Suporte Telefônico 24/7', included: true, star: false },
      ],
      highlighted: false,
      cta: lang === 'en' ? 'Contact Sales' : 'Contato',
    },
    /* {
      name: lang === 'en' ? 'Premium Ad Boost' : 'Anúncio Premium',
      price: '2,000',
      unit: lang === 'en' ? 'MZN / week' : 'MZN / semana',
      type: 'boost',
      description: lang === 'en' ? 'For immediate visibility and top placement of your listings.' : 'Para visibilidade imediata e destaque de seus anúncios.',
      features: [
        { label: lang === 'en' ? 'Top Placement for 1 Property' : 'Destaque de 1 Imóvel', included: true, star: true },
        { label: lang === 'en' ? 'Featured on Homepage' : 'Em Destaque na Home', included: true, star: true },
        { label: lang === 'en' ? 'Social Media Boost' : 'Impulsionamento nas Redes', included: true, star: false },
        { label: lang === 'en' ? '7-Day Duration' : 'Duração: 7 Dias', included: true, star: false },
        { label: lang === 'en' ? 'Email Alerts to Leads' : 'Alertas para Interessados', included: true, star: false },
        { label: lang === 'en' ? 'Performance Analytics' : 'Análise de Performance', included: true, star: false },
      ],
      highlighted: false,
      cta: lang === 'en' ? 'Boost Now' : 'Impulsionar Agora',
    }, */
  ];

  const faqs = [
    {
      q: lang === 'en' ? 'What payment methods do you accept?' : 'Quais métodos de pagamento vocês aceitam?',
      a: lang === 'en' ? 'We accept M-Pesa, e-Mola, debit cards, credit cards, and bank transfers. All payments are processed in local currency (MZN) with direct conversion from foreign currencies.' : 'Aceitamos M-Pesa, e-Mola, cartões de débito e crédito, e transferências bancárias. Todos os pagamentos são processados em moeda local (MZN) com conversão direta de moedas estrangeiras.',
    },
    {
      q: lang === 'en' ? 'Can I cancel my subscription anytime?' : 'Posso cancelar minha subscrição a qualquer momento?',
      a: lang === 'en' ? 'Yes, you can cancel your subscription at any time from your dashboard. Premium and Agency Pro subscriptions will remain active until the end of the billing period.' : 'Sim, você pode cancelar sua subscrição a qualquer momento. A subscrição permanecerá ativa até o final do período de faturamento.',
    },
    {
      q: lang === 'en' ? 'Do I need to pay for the Standard (Free) tier?' : 'Preciso pagar pela categoria Standard (Grátis)?',
      a: lang === 'en' ? 'No! The Standard tier is completely free. You can list 1 property for free. Upgrade anytime to access more listings and features.' : 'Não! A categoria Standard é completamente grátis. Você pode publicar 1 imóvel gratuitamente. Atualize sua conta a qualquer momento para acessar mais recursos.',
    },
    {
      q: lang === 'en' ? 'How do Premium Ad Boosts work?' : 'Como funcionam os Anúncios Premium?',
      a: lang === 'en' ? 'Premium Ad Boosts give your property top placement on our platform for 7 days. You pay 2,000 MZN per week to gain immediate visibility on the homepage and across our social media channels.' : 'Os Anúncios Premium colocam seu imóvel em destaque por 7 dias. Você paga 2.000 MZN por semana para ganhar visibilidade imediata na página inicial e em nossas redes sociais.',
    },
    {
      q: lang === 'en' ? 'Is there a transaction fee?' : 'Existe uma taxa de transação?',
      a: lang === 'en' ? 'Payment processing fees vary by method. M-Pesa and e-Mola have minimal fees. Please contact our support team for detailed information about fees for your chosen payment method.' : 'As taxas de processamento variam por método. M-Pesa e e-Mola têm taxas mínimas. Entre em contato com nossa equipe de suporte para mais detalhes.',
    },
    {
      q: lang === 'en' ? 'What is the curation process?' : 'Qual é o processo de curadoria?',
      a: lang === 'en' ? 'Every listing submitted goes through a quality review to ensure accuracy and protect our community. Listings are verified within 24 hours.' : 'Cada listagem passa por uma revisão de qualidade. As listagens são verificadas dentro de 24 horas.',
    },
  ];

  function handlePlanSelect(planType: string) {
    const auth = getAuth();
    if (auth.isLoggedIn) {
      router.push(`/post-property?plan=${planType}`);
    } else {
      router.push(`/auth?redirect=/post-property&plan=${planType}`);
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
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col p-8 rounded-xl relative transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-[#002045] text-white shadow-2xl scale-105 z-10 lg:col-span-1'
                  : 'bg-white hover:shadow-lg'
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#845326] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  {plan.badge}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-black mb-2 tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
                  {plan.name}
                </h3>
                <p className={`text-xs ${plan.highlighted ? 'text-[#fab983]/80' : 'text-[#74777f]'}`}>
                  {plan.description}
                </p>
              </div>
              <div className="mb-8">
                <span className="text-3xl font-black" style={{ fontFamily: 'var(--font-headline)' }}>
                  {plan.price}
                </span>
                <span className={`text-xs ml-2 ${plan.highlighted ? 'text-[#fab983]/80' : 'text-[#74777f]'}`}>
                  {plan.unit}
                </span>
              </div>
              <ul className="mb-8 space-y-3 flex-grow">
                {plan.features.map((f) => (
                  <li key={f.label} className={`flex items-start gap-3 text-xs leading-relaxed ${!f.included ? 'opacity-40' : ''}`}>
                    <span className={`material-symbols-outlined text-base flex-shrink-0 ${
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
              {plan.type === 'pro' ? (
                <a
                  href="/contact"
                  className={`w-full py-3 rounded-lg font-bold text-center block transition-all duration-300 text-sm ${
                    plan.highlighted
                      ? 'bg-[#845326] text-white hover:opacity-90'
                      : 'bg-[#f2f4f6] text-[#002045] hover:bg-[#002045] hover:text-white'
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  onClick={() => handlePlanSelect(plan.type)}
                  className={`w-full py-3 rounded-lg font-bold text-center block transition-all duration-300 text-sm ${
                    plan.highlighted
                      ? 'bg-[#845326] text-white hover:opacity-90'
                      : 'bg-[#f2f4f6] text-[#002045] hover:bg-[#002045] hover:text-white'
                  }`}
                >
                  {plan.cta}
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
