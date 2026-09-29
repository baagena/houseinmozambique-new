'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { afterAuth } from '@/lib/after-auth';
import { getAuth } from '@/lib/auth';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { toPlanView, type PricingPlanRecord } from '@/lib/pricing';
import Icon from '@/components/ui/Icon';

const VILLA_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuWSUXLzid2u3OTERtIK6qJpnQlbOOhtVc8LqRxn7Hrx7ruVHxYBf8--9D8l6yM3GhgeRVipuoE11QCFta8tp1kWWb90aRa29GOMGpZxetULhNqwHN9tg4DZJDQxxvHeC-Bc3s1qnnRU9xhJbqMu-ghY4452JCSdw7aDslq4hnlZFFAWHbV07Uq3tveepD8WDCZTmpWuIOLlG2eJpCcRD1tC_uwEg4ED4mP7Gc4i8hoQXD_vB7MunEBhDwdlvRjJzo8dR2NdGnUEs';

/** Feature labels mark their key words as **bold**, as the plan editor writes them. */
function Rich({ text }: { text: string }) {
  const parts = text.split('**');
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>{i % 2 === 1 ? <b>{part}</b> : part}</Fragment>
      ))}
    </>
  );
}

export default function PricingClient({ plans }: { plans: PricingPlanRecord[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const router = useRouter();
  const { lang, t } = useLanguage();
  const pt = lang === 'pt';

  // Plans are authored bilingually in the admin console; render the active language.
  const localizedPlans = plans.map((plan) => toPlanView(plan, lang));
  // The free tier is a note under the cards, as on houseinrwanda.com: it is a
  // courtesy for owners, not a product to compare against the paid ones.
  const paidPlans = localizedPlans.filter((p) => !p.isFree);
  const freePlan = localizedPlans.find((p) => p.isFree);

  const faqs = pt
    ? [
        { q: 'Qual é a diferença entre Destaque e Super Destaque?', a: 'Ambos publicam um anúncio e colocam-no na página inicial. O Destaque fica publicado 1 mês; o Super Destaque fica 3 meses no topo da página inicial, com banner, relatório mensal de visualizações e fotografias profissionais a pedido.' },
        { q: 'Como pago?', a: 'Escolha o plano e publique o anúncio. No seu painel aparecem as instruções de pagamento por M-Pesa, e-Mola ou transferência bancária. Depois de pagar, envie a referência; a nossa equipa confirma e o plano fica activo.' },
        { q: 'Posso anunciar grátis?', a: 'Sim. Cada conta tem 1 anúncio grátis online de cada vez. Os anúncios grátis não aparecem na página inicial e são revistos antes de serem publicados.' },
        { q: 'A Subscrição de Agentes renova sozinha?', a: 'Não. Cada mês é pago separadamente. Se não renovar, os seus anúncios continuam visíveis durante um curto período de tolerância e depois deixam de ser publicados até renovar.' },
        { q: 'Os anúncios são verificados?', a: 'Sim. Cada anúncio é revisto pela nossa equipa antes de aparecer online, para confirmar que o imóvel está realmente à venda ou para arrendar.' },
      ]
    : [
        { q: 'What is the difference between Featured and Super Featured?', a: 'Both publish one listing and put it on the homepage. Featured stays published for 1 month; Super Featured stays at the top of the homepage for 3 months, with a banner, a monthly views report and professional photos on request.' },
        { q: 'How do I pay?', a: 'Choose a plan and publish your listing. Your dashboard shows how to pay by M-Pesa, e-Mola or bank transfer. Once you have paid, send the reference; our team confirms it and the plan becomes active.' },
        { q: 'Can I list for free?', a: 'Yes. Every account has 1 free listing online at a time. Free listings do not appear on the homepage and are reviewed before they are published.' },
        { q: 'Does the Brokers Subscription renew automatically?', a: 'No. Each month is paid separately. If you do not renew, your listings stay visible for a short grace period and then stop being published until you renew.' },
        { q: 'Are listings checked?', a: 'Yes. Every listing is reviewed by our team before it appears online, to confirm the property really is for sale or rent.' },
      ];

  function handlePlanSelect(planSlug: string, toWizard = false) {
    /*
     * A plan with a price opens the listing wizard with that plan selected:
     * the agent builds the listing, the team confirms payment and approving
     * the listing activates the plan (lib/plan-requests.ts). `checkout` plans
     * — once online payment exists — go to billing to be bought directly.
     */
    const target = toWizard
      ? afterAuth('/post-property', { plan: planSlug })
      : `/dashboard/agent/billing?plan=${encodeURIComponent(planSlug)}`;
    const auth = getAuth();
    router.push(
      auth.isLoggedIn ? target : `/auth?redirect=${encodeURIComponent(target)}`,
    );
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
          <p className="plans-intro">
            {pt
              ? 'Leia com atenção a descrição dos nossos planos e escolha o que corresponde às suas necessidades.'
              : 'Please read the description of our posting plans and choose the one that fits your needs.'}
          </p>

          <div className="plans">
            {paidPlans.map((plan) => (
              <article key={plan.slug} className={`plan${plan.highlighted ? ' plan--pop' : ''}`}>
                <header className="plan__head">
                  <h3>{plan.name}</h3>
                  {plan.badge && <span className="plan__badge">{plan.badge}</span>}
                </header>

                <div className="plan__price">
                  {plan.price}
                  {plan.unit && <small>{plan.unit}</small>}
                </div>

                <ul className="plan__rows">
                  {plan.features.map((f) => (
                    <li key={f.label} className={f.included ? undefined : 'is-off'}>
                      {f.star && <Icon name="star" size={14} className="plan__star" />}
                      <span><Rich text={f.label} /></span>
                    </li>
                  ))}
                </ul>

                <div className="plan__cta">
                  {plan.ctaMode === 'contact' && !plan.hasPrice ? (
                    <Link
                      href={`/contact?subject=${encodeURIComponent(`${pt ? 'Plano' : 'Plan'}: ${plan.name}`)}`}
                      className="btn btn--full btn--gold"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button onClick={() => handlePlanSelect(plan.slug, plan.ctaMode === 'contact')} className="btn btn--full btn--gold">
                      {plan.cta}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <p className="plans-foot">
            {pt
              ? '* Cada anúncio só aparece online depois de confirmarmos que o imóvel está realmente à venda ou para arrendar.'
              : '* Every listing appears online only after we have checked that the property is indeed on the market for sale or rent.'}
          </p>

          <div className="plans-notes">
            {freePlan && (
              <div className="plans-note">
                <h3>{pt ? 'Opção grátis' : 'Free option'}</h3>
                <p>{freePlan.description}</p>
                <button onClick={() => handlePlanSelect(freePlan.slug, true)} className="plans-note__link">
                  {pt ? 'Para publicar um anúncio grátis, clique aqui' : 'To publish a free listing, click here'} →
                </button>
              </div>
            )}
            <div className="plans-note">
              <h3>{pt ? 'Formas de pagamento' : 'Payment methods'}</h3>
              <p>
                {pt
                  ? 'O seu anúncio é verificado antes de aparecer online. Para acelerar a validação, faça o pagamento depois de receber a confirmação do anúncio:'
                  : 'Your listing is checked before it appears online. To speed up validation, pay after you receive the listing confirmation:'}
              </p>
              <ul>
                <li><b>M-Pesa</b> {pt ? 'ou' : 'or'} <b>e-Mola</b> — {pt ? 'o número aparece no seu painel ao escolher o plano' : 'the number is shown in your dashboard when you choose the plan'}</li>
                <li>{pt ? 'Transferência bancária' : 'Bank transfer'} — {pt ? 'os dados da conta aparecem no seu painel' : 'account details are shown in your dashboard'}</li>
                <li>{pt ? 'Dúvidas?' : 'Questions?'} <Link href="/contact">{pt ? 'Fale connosco' : 'Contact us'}</Link></li>
              </ul>
            </div>
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
                      <Icon name={item.icon} size={18} />
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
                  <Icon name="expand_more" size={18} className={`text-[var(--hm-muted)] transition-transform ${ openFaq === i ? 'rotate-180' : '' }`} />
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
