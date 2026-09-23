'use client';

/**
 * The agent's side of billing, in the console's own design language.
 *
 * Built from the primitives in dashboard-ui.css — card / card-head / stat /
 * meter / plan-card — rather than raw utility classes, so it reads as the same
 * product as the sidebar beside it. The agent pages written before that system
 * existed still use their own styling and look like a different application;
 * this is the pattern they should be converted to.
 *
 * The order answers the questions in the order they get asked: what am I on,
 * how much of it have I used, what do I owe and when, how do I pay, what else
 * could I be on, and what have I paid before.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { useLanguage } from '@/components/i18n/LanguageContext';
import type { EntitlementState } from '@/lib/entitlements';
import type { PaymentInstructions } from '@/lib/payment-instructions';
import PaymentProofPanel, { type OpenPaymentView } from '@/components/dashboard/PaymentProofPanel';

interface SubscriptionView {
  id: string;
  status: string;
  currentPeriodEnd: string;
  graceUntil: string | null;
  cancelAtPeriodEnd: boolean;
  grantNote: string | null;
  planSlug: string;
  planNameEn: string;
  planNamePt: string;
  priceMinor: number;
  currency: string;
  interval: string | null;
}

interface PaymentView {
  id: string; orderRef: string; amountMinor: number; currency: string;
  method: string; planType: string; status: string;
  createdAt: string; completedAt: string | null;
  reviewNote: string | null;
  planName: string | null; planNameEn: string | null;
}

/** "manual" is how the database spells it, not how anyone says it. */
const METHOD_LABEL: Record<string, { en: string; pt: string }> = {
  manual: { en: 'Direct / transfer', pt: 'Directo / transferência' },
  mpesa: { en: 'M-Pesa', pt: 'M-Pesa' },
  emola: { en: 'e-Mola', pt: 'e-Mola' },
  card: { en: 'Card', pt: 'Cartão' },
};

interface PlanView {
  slug: string; kind: string; nameEn: string; namePt: string;
  descriptionEn: string; descriptionPt: string;
  priceMinor: number; currency: string; interval: string | null;
  listingQuota: number; featuredQuota: number; durationDays: number | null;
  highlighted: boolean;
}

interface CreditView {
  id: string; status: string; planName: string;
  createdAt: string; consumedAt: string | null; expiresAt: string | null;
}

/** Centavos to "3.500 MZN". Grouped the Portuguese way, which is what the site defaults to. */
function money(minor: number, currency: string, lang: string) {
  const major = minor / 100;
  return `${new Intl.NumberFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', {
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major)} ${currency}`;
}

const fmtDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

const daysBetween = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

/**
 * The plan grid's frame: an ordinary card normally, a closed disclosure while a
 * payment is waiting to settle.
 *
 * Same children either way, so the grid itself does not have to know which it
 * is in — the only difference is whether the agent has to ask for it.
 */
function PlanShell({
  pt, folded, children,
}: {
  pt: boolean;
  folded: boolean;
  children: React.ReactNode;
}) {
  if (!folded) {
    return (
      <div className="card">
        <div className="card-head">
          <h3>{pt ? 'Planos' : 'Plans'}</h3>
          <span className="hint">{pt ? 'Mude a qualquer momento' : 'Change at any time'}</span>
        </div>
        {children}
      </div>
    );
  }

  return (
    <details className="plan-fold">
      <summary>
        <Icon name="expand_more" size={15} />
        {pt ? 'Ver ou mudar de plano' : 'See or change plan'}
      </summary>
      {children}
    </details>
  );
}

export default function AgentBillingClient({
  state, subscription, payments, plans, credits, graceDays,
  instructions, destinationConfigured, openPayment,
}: {
  state: EntitlementState;
  subscription: SubscriptionView | null;
  payments: PaymentView[];
  plans: PlanView[];
  credits: CreditView[];
  graceDays: number;
  instructions: PaymentInstructions;
  destinationConfigured: boolean;
  openPayment: OpenPaymentView | null;
}) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justStarted, setJustStarted] = useState(false);
  const payRef = useRef<HTMLDivElement | null>(null);

  /* Once the refreshed server render has put the panel on the page, jump to
     it. Keyed on the payment's own id so a second plan choice scrolls again. */
  useEffect(() => {
    if (justStarted && openPayment && payRef.current) {
      payRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setJustStarted(false);
    }
  }, [justStarted, openPayment]);

  const pt = lang === 'pt';
  const planName = subscription ? (pt ? subscription.planNamePt : subscription.planNameEn) : null;
  const isFree = !subscription || subscription.priceMinor === 0;
  const daysLeft = subscription ? daysBetween(subscription.graceUntil ?? subscription.currentPeriodEnd) : null;

  /* A free plan never lapses, so "renews in 18,000 days" is noise. Only a paid
   * period has a date worth showing. */
  const showsRenewal = Boolean(subscription && subscription.priceMinor > 0);

  const quotaPct = state.quota === -1
    ? 0
    : Math.min(100, Math.round((state.used / Math.max(1, state.quota)) * 100));

  async function choose(slug: string) {
    setBusy(slug);
    setError(null);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: slug, method: 'manual' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start that payment.');
      /*
       * A refresh alone left the agent looking at the plan grid with no sign
       * that anything had happened — the new "finish your payment" panel
       * renders above the fold on the server, so the page has to take them to
       * it or the reference they now owe money against is off screen.
       */
      router.refresh();
      setJustStarted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start that payment.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="page-head">
        <h1>{pt ? 'Faturação' : 'Billing'}</h1>
        <p>
          {pt
            ? 'O seu plano, o que já usou e o que falta pagar.'
            : 'Your plan, what you have used, and what is due.'}
        </p>
      </div>

      {/* 1 · WHERE THEY STAND ------------------------------------------- */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>{pt ? 'Plano actual' : 'Current plan'}</h3>
            <span className={`pill ${state.inGrace ? 'warn' : isFree ? '' : 'good'}`}>
              {state.inGrace
                ? (pt ? 'Em tolerância' : 'In grace')
                : isFree ? (pt ? 'Grátis' : 'Free') : (pt ? 'Activo' : 'Active')}
            </span>
          </div>

          <div className="bh">
            <div className="bh-value">{planName ?? (pt ? 'Sem plano' : 'No plan')}</div>

            <div className="bh-sub">
              {subscription && subscription.priceMinor > 0
                ? `${money(subscription.priceMinor, subscription.currency, lang)}${
                  subscription.interval === 'year' ? (pt ? ' / ano' : ' / year') : (pt ? ' / mês' : ' / month')
                }`
                : (pt ? 'Sem custo mensal' : 'No monthly cost')}
            </div>

            {showsRenewal && subscription && (
              <p className="bh-note">
                {state.inGrace
                  ? (pt
                    ? <>O período terminou. Tem <strong>{Math.max(0, daysLeft ?? 0)} dia(s)</strong> de tolerância — os seus anúncios continuam online.</>
                    : <>The period ended. You have <strong>{Math.max(0, daysLeft ?? 0)} day(s)</strong> of grace — your listings stay online.</>)
                  : (pt
                    ? <>Renova a <strong>{fmtDate(subscription.currentPeriodEnd, lang)}</strong> — daqui a {daysLeft} dias.</>
                    : <>Renews <strong>{fmtDate(subscription.currentPeriodEnd, lang)}</strong> — {daysLeft} days from now.</>)}
              </p>
            )}

            {!showsRenewal && (
              <p className="bh-note">
                {pt
                  ? 'O plano grátis não expira. Publica um anúncio de cada vez.'
                  : 'The free plan does not expire. One listing at a time.'}
              </p>
            )}

            {subscription?.grantNote && (
              <div className="bh-grant">{pt ? 'Concedido: ' : 'Granted: '}{subscription.grantNote}</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>{pt ? 'Anúncios activos' : 'Active listings'}</h3>
            {state.credits > 0 && (
              <span className="pill good">
                {state.credits} {pt ? 'crédito(s)' : 'credit(s)'}
              </span>
            )}
          </div>
          <div className="bh">
            <div className="bh-value">
              {state.used}
              <span className="bh-of">
                {state.quota === -1 ? (pt ? ' / ilimitado' : ' / unlimited') : ` / ${state.quota}`}
              </span>
            </div>

            <div className="bh-sub">
              {state.quota === -1
                ? (pt ? 'Sem limite' : 'No limit')
                : state.canPublish
                  ? (pt
                    ? `Pode publicar mais ${(state.remaining ?? 0) + state.credits}`
                    : `${(state.remaining ?? 0) + state.credits} more available`)
                  : (pt ? 'Sem espaço livre' : 'No slots free')}
            </div>

            {state.quota !== -1 && (
              <div className="meter">
                <i className={quotaPct >= 100 ? 'mfill is-full' : 'mfill'} style={{ width: `${quotaPct}%` }} />
              </div>
            )}

            <p className="bh-note">
              {state.canPublish
                ? (pt
                  ? 'Cada anúncio retirado liberta um espaço.'
                  : 'Taking a listing down frees a slot.')
                : (pt
                  ? 'Actualize o plano, compre um anúncio avulso, ou retire um anúncio para libertar espaço.'
                  : 'Upgrade, buy a single listing, or take one down to free a slot.')}
            </p>
          </div>
        </div>
      </div>

      {/* 2 · WHAT IS DUE -------------------------------------------------
          Silent while a payment is open. Its whole job is to push the agent
          towards a plan, and once they have chosen one and owe money for it
          the push is answered — "choose a plan below" is then both redundant
          and untrue, since the grid below is folded away. */}
      {!openPayment && (state.inGrace || !state.canPublish || isFree) && (
        <div className={`alert ${state.inGrace ? 'warn' : ''}`}>
          <Icon name={state.inGrace ? 'schedule' : 'info'} size={18} />
          <div>
            <div className="a-title">
              {state.inGrace
                ? (pt ? 'Pagamento em atraso' : 'Payment overdue')
                : !state.canPublish
                  ? (pt ? 'Limite de anúncios atingido' : 'Listing limit reached')
                  : (pt ? 'Está no plano grátis' : 'You are on the free plan')}
            </div>
            <p>
              {state.inGrace
                ? (pt
                  ? `Os seus anúncios continuam online durante ${graceDays} dias. Renove para não os perder.`
                  : `Your listings stay online for ${graceDays} days. Renew to keep them.`)
                : !state.canPublish
                  ? (pt
                    ? 'Escolha um plano abaixo para publicar mais imóveis.'
                    : 'Choose a plan below to publish more properties.')
                  : (pt
                    ? 'Um plano mensal permite publicar vários imóveis e pagar todos os meses.'
                    : 'A monthly plan lets you publish several properties and pay each month.')}
            </p>
          </div>
        </div>
      )}

      {/* 2b · THE OPEN PAYMENT ------------------------------------------
          Above the plan grid on purpose. An agent who has already chosen a
          plan and owes money for it should not have to scroll past the menu to
          find out where to send it. */}
      {openPayment && (
        <div ref={payRef}>
          <PaymentProofPanel
            payment={openPayment}
            instructions={instructions}
            destinationConfigured={destinationConfigured}
            pt={pt}
          />
        </div>
      )}

      {/* 3 · PLANS -------------------------------------------------------
          Folded away while a payment is open. A full grid of buy buttons under
          a "pay 3.500 MZN" card is an invitation to start a second payment
          before the first has settled — which is how an agent ends up with two
          references and no idea which one they paid against. */}
      <PlanShell pt={pt} folded={Boolean(openPayment)}>

        {error && <div className="alert crit" style={{ margin: 16 }}><Icon name="error" size={18} /><div><p>{error}</p></div></div>}

        <div className="bill-plans">
          {plans.map((p) => {
            const current = subscription?.planSlug === p.slug;
            const oneOff = p.kind === 'one_off';
            return (
              <div key={p.slug} className={`bill-plan${current ? ' is-on' : ''}`}>
                {current && <div className="bp-current">{pt ? 'O seu plano' : 'Your plan'}</div>}
                <div className="bp-name">{pt ? p.namePt : p.nameEn}</div>
                <div className="bp-price">
                  {p.priceMinor === 0 ? (pt ? 'Grátis' : 'Free') : money(p.priceMinor, p.currency, lang)}
                  {p.priceMinor > 0 && (
                    <span>
                      {oneOff
                        ? (pt ? ' / anúncio' : ' / listing')
                        : p.interval === 'year' ? (pt ? ' / ano' : ' / year') : (pt ? ' / mês' : ' / month')}
                    </span>
                  )}
                </div>
                <p className="bp-desc">{pt ? p.descriptionPt : p.descriptionEn}</p>

                <ul>
                  <li>
                    <Icon name="check" size={14} />
                    {oneOff
                      ? (pt ? `1 anúncio durante ${p.durationDays ?? 60} dias` : `1 listing for ${p.durationDays ?? 60} days`)
                      : p.listingQuota === -1
                        ? (pt ? 'Anúncios ilimitados' : 'Unlimited listings')
                        : (pt ? `${p.listingQuota} anúncio(s) activo(s)` : `${p.listingQuota} active listing(s)`)}
                  </li>
                  {p.featuredQuota > 0 && (
                    <li>
                      <Icon name="check" size={14} />
                      {pt ? `${p.featuredQuota} em destaque` : `${p.featuredQuota} featured`}
                    </li>
                  )}
                  {!oneOff && p.priceMinor > 0 && (
                    <li>
                      <Icon name="check" size={14} />
                      {pt ? 'Pagamento mensal' : 'Billed monthly'}
                    </li>
                  )}
                </ul>

                <button
                  className={`btn${p.highlighted && !current ? ' primary' : ''}`}
                  style={{ marginTop: 12, width: '100%' }}
                  disabled={current || busy !== null || p.priceMinor === 0}
                  onClick={() => choose(p.slug)}
                >
                  {current
                    ? (pt ? 'Plano actual' : 'Current plan')
                    : p.priceMinor === 0
                      ? (pt ? 'Incluído' : 'Included')
                      : busy === p.slug
                        ? (pt ? 'A preparar…' : 'Starting…')
                        : oneOff
                          ? (pt ? 'Comprar anúncio' : 'Buy a listing')
                          : (pt ? 'Escolher' : 'Choose')}
                </button>
              </div>
            );
          })}
        </div>
      </PlanShell>

      {/* 4 · SINGLE LISTINGS BOUGHT -------------------------------------- */}
      {credits.length > 0 && (
        <div className="card">
          <div className="card-head"><h3>{pt ? 'Anúncios avulsos' : 'Single listings'}</h3></div>
          <div className="bill-rows">
            {credits.map((c) => (
              <div key={c.id} className="bill-row">
                <div className="br-main"><div className="br-title">{c.planName}</div></div>
                <span className="br-when">{fmtDate(c.createdAt, lang)}</span>
                <span className={`pill ${c.status === 'AVAILABLE' ? 'good' : ''}`}>
                  {c.status === 'AVAILABLE'
                    ? (pt ? 'Por usar' : 'Unused')
                    : c.status === 'CONSUMED'
                      ? (pt ? 'Usado' : 'Used')
                      : (pt ? 'Expirado' : 'Expired')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5 · HISTORY ----------------------------------------------------- */}
      <div className="card">
        <div className="card-head">
          <h3>{pt ? 'Histórico de pagamentos' : 'Payment history'}</h3>
          <span className="hint">{payments.length}</span>
        </div>

        {payments.length === 0 ? (
          <div className="empty">
            <Icon name="payments" size={26} />
            <span>{pt ? 'Ainda não há pagamentos.' : 'No payments yet.'}</span>
          </div>
        ) : (
          <div className="bill-rows">
            {payments.map((p) => (
              <div key={p.id} className="bill-row">
                <div className="br-main">
                  <div className="br-title">{(pt ? p.planName : p.planNameEn) ?? p.planType}</div>
                  <div className="br-sub">{p.orderRef}</div>
                </div>
                <span className="br-when">{fmtDate(p.completedAt ?? p.createdAt, lang)}</span>
                <span className="br-how">
                  {METHOD_LABEL[p.method]?.[pt ? 'pt' : 'en'] ?? p.method}
                </span>
                <span className="br-amt">{money(p.amountMinor, p.currency, lang)}</span>
                <span
                  className={`pill ${
                    p.status === 'COMPLETED' ? 'good'
                      : p.status === 'FAILED' || p.status === 'REJECTED' ? 'crit'
                        : p.status === 'CANCELLED' ? 'muted'
                          : 'warn'
                  }`}
                  /* A rejection the agent cannot read the reason for is a dead
                     end, and the reason is too long for the pill. */
                  title={p.reviewNote ?? undefined}
                >
                  {p.status === 'COMPLETED'
                    ? (pt ? 'Pago' : 'Paid')
                    : p.status === 'FAILED'
                      ? (pt ? 'Falhou' : 'Failed')
                      : p.status === 'CANCELLED'
                        ? (pt ? 'Fechado' : 'Closed')
                        : p.status === 'REJECTED'
                          ? (pt ? 'Não confirmado' : 'Not confirmed')
                          : p.status === 'SUBMITTED'
                            ? (pt ? 'Em análise' : 'In review')
                            : (pt ? 'Pendente' : 'Pending')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
