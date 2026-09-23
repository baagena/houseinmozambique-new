'use client';

/**
 * Paying to push one listing up.
 *
 * The moment this is offered matters: after the listing exists and the agent
 * can see how it is doing, not during the wizard. An agent asked "would you
 * like to feature this?" before publishing has no idea whether it needs it; an
 * agent looking at a listing with eleven views in a fortnight does.
 *
 * Buying does not switch anything on. It opens one payment covering everything
 * chosen and hands the agent straight to the billing page, which is where
 * every other payment here is completed — one payment screen, not two.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { useLanguage } from '@/components/i18n/LanguageContext';

export interface BoostOffer {
  kind: 'FEATURED' | 'URGENT';
  nameEn: string;
  namePt: string;
  descriptionEn: string;
  descriptionPt: string;
  priceMinor: number;
  currency: string;
  days: number;
}

export interface RunningBoost {
  kind: string;
  status: string;
  expiresAt: string | null;
}

const ICON: Record<string, string> = { FEATURED: 'star', URGENT: 'trending_up' };

function money(minor: number, currency: string, pt: boolean) {
  const major = minor / 100;
  return `${new Intl.NumberFormat(pt ? 'pt-PT' : 'en-GB', {
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major)} ${currency}`;
}

export default function BoostListingClient({
  listingId, listingTitle, views, offers, running, destinationConfigured,
}: {
  listingId: string;
  listingTitle: string;
  views: number;
  offers: BoostOffer[];
  running: RunningBoost[];
  destinationConfigured: boolean;
}) {
  const router = useRouter();
  const { lang } = useLanguage();
  const pt = lang === 'pt';

  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takenKinds = new Set(running.map((r) => r.kind));
  const available = offers.filter((o) => !takenKinds.has(o.kind));
  const total = offers
    .filter((o) => picked.includes(o.kind))
    .reduce((sum, o) => sum + o.priceMinor, 0);
  const currency = offers[0]?.currency ?? 'MZN';

  function toggle(kind: string) {
    setError(null);
    setPicked((p) => (p.includes(kind) ? p.filter((k) => k !== kind) : [...p, kind]));
  }

  async function buy() {
    if (picked.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kinds: picked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not reserve that.');
      /* Straight to the page that already knows how to collect a payment. */
      router.push('/dashboard/agent/billing');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reserve that.');
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{pt ? 'Destacar' : 'Boost'}</p>
          <h1>{pt ? 'Dar mais visibilidade' : 'Push this listing up'}</h1>
          <p>{listingTitle}</p>
        </div>
        <Link className="btn" href="/dashboard/agent/listings">
          <Icon name="arrow_back" size={15} />
          {pt ? 'Voltar' : 'Back'}
        </Link>
      </div>

      {error && <div className="alert crit"><Icon name="error" size={18} /><div><div className="a-sub">{error}</div></div></div>}

      {offers.length === 0 ? (
        <div className="card">
          <div className="empty">
            <Icon name="star" size={26} />
            <p style={{ margin: '8px 0 0', fontWeight: 600, color: 'var(--d-text-1)' }}>
              {pt ? 'Ainda não há destaques à venda' : 'No boosts are on sale yet'}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)' }}>
              {pt
                ? 'A equipa ainda não definiu preços para destaque ou urgência.'
                : 'The team has not priced featured or urgent placement yet.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-head">
            <h3>{pt ? 'Escolha o que quer' : 'Choose what you want'}</h3>
            <span className="hint">
              {views} {pt ? 'visualizações até agora' : 'views so far'}
            </span>
          </div>

          <div className="pay-body">
            {running.length > 0 && (
              <div className="pay-rows">
                {running.map((r) => (
                  <div key={r.kind} className="pay-row">
                    <span className="pay-row-k">
                      {r.kind === 'URGENT' ? (pt ? 'Urgente' : 'Urgent') : (pt ? 'Destaque' : 'Featured')}
                    </span>
                    <span className="pay-row-v">
                      <strong>
                        {r.status === 'ACTIVE'
                          ? (pt ? 'A correr' : 'Running')
                          : (pt ? 'À espera de pagamento' : 'Waiting on payment')}
                      </strong>
                      {r.expiresAt && (
                        <em>
                          {pt ? 'até ' : 'until '}
                          {new Date(r.expiresAt).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </em>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {available.length === 0 ? (
              <p className="pay-hint">
                {pt
                  ? 'Já tem todos os destaques disponíveis neste anúncio.'
                  : 'Every boost we sell is already on this listing.'}
              </p>
            ) : (
              <div className="boost-grid">
                {available.map((o) => {
                  const on = picked.includes(o.kind);
                  return (
                    <button
                      key={o.kind}
                      type="button"
                      className={`boost-card${on ? ' is-on' : ''}`}
                      aria-pressed={on}
                      onClick={() => toggle(o.kind)}
                    >
                      <span className="boost-ico"><Icon name={ICON[o.kind] ?? 'star'} size={18} /></span>
                      <span className="boost-body">
                        <strong>{pt ? o.namePt : o.nameEn}</strong>
                        <small>{pt ? o.descriptionPt : o.descriptionEn}</small>
                        <em>
                          {money(o.priceMinor, o.currency, pt)} · {o.days} {pt ? 'dias' : 'days'}
                        </em>
                      </span>
                      <span className={`boost-tick${on ? ' is-on' : ''}`}>
                        {on && <Icon name="check" size={13} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {picked.length > 0 && (
              <>
                <div className="pay-rows">
                  <div className="pay-row">
                    <span className="pay-row-k">{pt ? 'Total' : 'Total'}</span>
                    <span className="pay-row-v"><strong>{money(total, currency, pt)}</strong></span>
                  </div>
                </div>
                {!destinationConfigured && (
                  <p className="pay-hint">
                    {pt
                      ? 'Ainda não há dados de pagamento publicados — vamos criar a referência e a equipa envia-lhe para onde pagar.'
                      : 'No payment details are published yet — we will create the reference and the team will send you where to pay.'}
                  </p>
                )}
              </>
            )}

            <div className="pay-actions">
              <button className="btn primary" disabled={busy || picked.length === 0} onClick={buy}>
                {busy
                  ? (pt ? 'A reservar…' : 'Reserving…')
                  : picked.length === 0
                    ? (pt ? 'Escolha um destaque' : 'Pick a boost')
                    : (pt ? `Reservar por ${money(total, currency, pt)}` : `Reserve for ${money(total, currency, pt)}`)}
              </button>
            </div>

            <p className="pay-hint">
              {pt
                ? 'O destaque só começa depois de o pagamento ser confirmado.'
                : 'The boost starts only once your payment is confirmed.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
