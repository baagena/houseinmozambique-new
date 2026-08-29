'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAuth } from '@/lib/auth';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { toPlanView, type PricingPlanRecord } from '@/lib/pricing';

const VILLA_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuWSUXLzid2u3OTERtIK6qJpnQlbOOhtVc8LqRxn7Hrx7ruVHxYBf8--9D8l6yM3GhgeRVipuoE11QCFta8tp1kWWb90aRa29GOMGpZxetULhNqwHN9tg4DZJDQxxvHeC-Bc3s1qnnRU9xhJbqMu-ghY4452JCSdw7aDslq4hnlZFFAWHbV07Uq3tveepD8WDCZTmpWuIOLlG2eJpCcRD1tC_uwEg4ED4mP7Gc4i8hoQXD_vB7MunEBhDwdlvRjJzo8dR2NdGnUEs';

export default function PricingClient({ plans }: { plans: PricingPlanRecord[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const router = useRouter();
  const { lang, t } = useLanguage();

  // Plans are authored bilingually in the admin console; render the active language.
  const localizedPlans = plans.map((plan) => toPlanView(plan, lang));

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

  function handlePlanSelect(planSlug: string) {
    const auth = getAuth();
    if (auth.isLoggedIn) {
      router.push(`/post-property?plan=${planSlug}`);
    } else {
      router.push(`/auth?redirect=/post-property&plan=${planSlug}`);
    }
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="page-hero__bg">
          <Image src={VILLA_IMG} alt="" fill priority className="object-cover" sizes="100vw" />
        </div>
        <div className="wrap">
          <span className="eyebrow">{t.pricing.heroBadge}</span>
          <h1 className="display-l">{t.pricing.heroTitle}</h1>
          <p>{t.pricing.heroSubtitle}</p>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className="section">
        <div className="wrap">
          <div className="tiers">
            {localizedPlans.map((plan) => (
              <div key={plan.slug} className={`tier${plan.highlighted ? ' tier--pop' : ''}`}>
                {plan.badge && <span className="pop-badge">{plan.badge}</span>}

                <h3>{plan.name}</h3>
                <p className="tsub">{plan.description}</p>

                <div className="tprice">
                  {plan.price}
                  {plan.unit && <small> {plan.unit}</small>}
                </div>

                <ul>
                  {plan.features.map((f) => (
                    <li key={f.label} style={f.included ? undefined : { opacity: 0.45 }}>
                      <span className="material-symbols-outlined ic text-[1.05rem]">
                        {f.included ? (f.star ? 'star' : 'check') : 'remove'}
                      </span>
                      <span>{f.label}</span>
                    </li>
                  ))}
                </ul>

                {plan.ctaMode === 'contact' ? (
                  <a
                    href="/contact"
                    className={`btn btn--full ${plan.highlighted ? 'btn--gold' : 'btn--ghost'}`}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <button
                    onClick={() => handlePlanSelect(plan.slug)}
                    className={`btn btn--full ${plan.highlighted ? 'btn--gold' : 'btn--ghost'}`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why list with us ── */}
      <section className="section pt0">
        <div className="wrap">
          <article className="feature">
            <div className="feature__media">
              <Image
                src={VILLA_IMG}
                alt="Luxury villa listed on House in Mozambique"
                fill
                className="object-cover"
                sizes="(max-width: 1000px) 100vw, 55vw"
              />
            </div>
            <div className="feature__body">
              <span className="eyebrow">{t.pricing.exclusiveCuration}</span>
              <h2>{t.pricing.whyListTitle}</h2>
              <p className="muted">{t.pricing.exclusiveCurationDesc}</p>

              <ul className="mt-6 space-y-5">
                {[
                  { icon: 'visibility', title: t.pricing.highIntentAudience, desc: t.pricing.highIntentAudienceDesc },
                  { icon: 'camera_enhance', title: t.pricing.editorialPresentation, desc: t.pricing.editorialPresentationDesc },
                  { icon: 'analytics', title: t.pricing.inDepthInsights, desc: t.pricing.inDepthInsightsDesc },
                ].map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-[11px] bg-[var(--paper)] text-[var(--gold-deep)]">
                      <span className="material-symbols-outlined text-[1.1rem]">{item.icon}</span>
                    </span>
                    <span>
                      <span className="block font-semibold text-[var(--ink)]">{item.title}</span>
                      <span className="muted block text-[0.88rem] leading-relaxed">{item.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section pt0">
        <div className="wrap">
          <div className="section-head mx-auto text-center">
            <span className="eyebrow">FAQ</span>
            <h2>{t.pricing.faqTitle}</h2>
            <p className="lead mx-auto">{t.pricing.faqSubtitle}</p>
          </div>

          <div className="faq">
            {faqs.map((faq, i) => (
              <details key={i} className="faq-item" open={openFaq === i}>
                <summary
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenFaq(openFaq === i ? null : i);
                  }}
                >
                  {faq.q}
                  <span
                    className={`material-symbols-outlined text-[1.1rem] text-[var(--hm-muted)] transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
