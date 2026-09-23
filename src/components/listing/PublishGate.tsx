'use client';

/**
 * What an agent meets when their plan has no room for the listing they just
 * finished writing.
 *
 * The shape of this screen follows what usage-limit paywalls get right and
 * what they get wrong:
 *
 *   · It appears at the LIMIT, not before. The agent has already built the
 *     listing and can see what they would be publishing, which is the only
 *     moment they can judge whether a plan is worth it. A price asked before
 *     the value is shown is a price asked too early.
 *   · The work is never lost. This is an overlay on the wizard, not a
 *     navigation — every answer, photo and the preview are still behind it,
 *     and closing it puts the agent back exactly where they were.
 *   · There is an ESCAPE HATCH. "Take one down to free a slot" is the option
 *     that costs nothing, and it is offered as prominently as the two that
 *     cost money. A paywall whose only exit is a payment is a wall.
 *   · Three doors, not a price list. Upgrade, buy this one listing, or free a
 *     slot. Offering every tier makes the agent do the comparison.
 *
 * It is deliberately not dismissible-and-forgotten: closing it returns to the
 * wizard with the banner still showing, because the listing genuinely cannot
 * be published until one of the three is chosen.
 */

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { suspendAgentProperty } from '@/actions/properties';

export interface GatePlan {
  slug: string; kind: string; nameEn: string; namePt: string;
  priceMinor: number; currency: string; interval: string | null;
  listingQuota: number; durationDays: number | null; highlighted: boolean;
}

export interface GateListing {
  id: string; title: string; status: string; place: string;
  cover: string | null; views: number; createdAt: string;
}

export interface GateState {
  planSlug: string | null; planName: string | null;
  quota: number; used: number; credits: number;
}

function money(minor: number, currency: string, lang: string) {
  const major = minor / 100;
  return `${new Intl.NumberFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', {
    minimumFractionDigits: major % 1 === 0 ? 0 : 2, maximumFractionDigits: 2,
  }).format(major)} ${currency}`;
}

type Tab = 'upgrade' | 'single' | 'free';

export default function PublishGate({
  state, upgrades, oneOffs, listings, onClose, onFreed, onPaid, onSaveDraft, savingDraft,
}: {
  state: GateState;
  upgrades: GatePlan[];
  oneOffs: GatePlan[];
  listings: GateListing[];
  onClose: () => void;
  /** A slot was freed — the caller re-checks and can submit. */
  onFreed: () => void;
  /** A payment was started for this plan. */
  onPaid: (slug: string) => void;
  /** Keep the work without publishing it. */
  onSaveDraft: () => void;
  savingDraft?: boolean;
}) {
  const { lang } = useLanguage();
  const pt = lang === 'pt';
  const [tab, setTab] = useState<Tab>(upgrades.length ? 'upgrade' : 'single');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planName = state.planName ?? (pt ? 'Grátis' : 'Free');

  async function freeSlot(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await suspendAgentProperty(id);
      if (!res.success) throw new Error(('error' in res && res.error) || 'Could not take that listing down.');
      onFreed();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not take that listing down.');
    } finally {
      setBusy(null);
    }
  }

  async function buy(slug: string) {
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
      onPaid(slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start that payment.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={pt ? 'Publicar anúncio' : 'Publish listing'}>
      <div className="modal-panel gate">
        <button className="modal-close" onClick={onClose} aria-label={pt ? 'Fechar' : 'Close'}>
          <Icon name="close" size={18} />
        </button>

        <div className="gate-head">
          <h3>
            {pt
              ? `Usou os ${state.quota} anúncio(s) do plano ${planName}`
              : `You have used all ${state.quota} listing${state.quota === 1 ? '' : 's'} on ${planName}`}
          </h3>
          <p>
            {pt
              ? 'O seu anúncio está pronto e guardado nesta página — escolha como quer publicá-lo.'
              : 'Your listing is finished and still here — choose how you want to publish it.'}
          </p>
          <div className="meter"><i className="mfill is-full" style={{ width: '100%' }} /></div>
          <span className="hint">{state.used} / {state.quota}</span>
        </div>

        <div className="seg gate-tabs">
          {upgrades.length > 0 && (
            <button className={`seg-btn${tab === 'upgrade' ? ' is-on' : ''}`} onClick={() => setTab('upgrade')}>
              {pt ? 'Mudar de plano' : 'Upgrade'}
            </button>
          )}
          {oneOffs.length > 0 && (
            <button className={`seg-btn${tab === 'single' ? ' is-on' : ''}`} onClick={() => setTab('single')}>
              {pt ? 'Pagar só este' : 'Just this one'}
            </button>
          )}
          <button className={`seg-btn${tab === 'free' ? ' is-on' : ''}`} onClick={() => setTab('free')}>
            {pt ? 'Libertar espaço' : 'Free a slot'}
          </button>
        </div>

        {error && (
          <div className="alert crit" style={{ margin: '0 18px 12px' }}>
            <Icon name="error" size={18} /><div><p>{error}</p></div>
          </div>
        )}

        <div className="gate-body">
          {tab === 'upgrade' && (
            <div className="bill-plans" style={{ padding: 0 }}>
              {upgrades.map((p) => (
                <div key={p.slug} className={`bill-plan${p.highlighted ? ' is-on' : ''}`}>
                  <div className="bp-name">{pt ? p.namePt : p.nameEn}</div>
                  <div className="bp-price">
                    {money(p.priceMinor, p.currency, lang)}
                    <span>{p.interval === 'year' ? (pt ? ' / ano' : ' / year') : (pt ? ' / mês' : ' / month')}</span>
                  </div>
                  {/* What changes for them, not what the plan contains. */}
                  <p className="foot-note">
                    {p.listingQuota === -1
                      ? (pt ? 'Anúncios ilimitados' : 'Unlimited listings')
                      : (pt
                        ? `${p.listingQuota} anúncios activos — mais ${p.listingQuota - state.quota} do que agora`
                        : `${p.listingQuota} active listings — ${p.listingQuota - state.quota} more than now`)}
                  </p>
                  <button className="btn primary" disabled={busy !== null} onClick={() => buy(p.slug)}>
                    {busy === p.slug ? (pt ? 'A preparar…' : 'Starting…') : (pt ? 'Escolher' : 'Choose')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'single' && (
            <div className="bill-plans" style={{ padding: 0 }}>
              {oneOffs.map((p) => (
                <div key={p.slug} className="bill-plan">
                  <div className="bp-name">{pt ? p.namePt : p.nameEn}</div>
                  <div className="bp-price">
                    {money(p.priceMinor, p.currency, lang)}
                    <span>{pt ? ' uma vez' : ' once'}</span>
                  </div>
                  <p className="foot-note">
                    {pt
                      ? `Este anúncio fica online ${p.durationDays ?? 60} dias. Sem plano, sem renovação.`
                      : `This listing stays up for ${p.durationDays ?? 60} days. No plan, no renewal.`}
                  </p>
                  <button className="btn primary" disabled={busy !== null} onClick={() => buy(p.slug)}>
                    {busy === p.slug ? (pt ? 'A preparar…' : 'Starting…') : (pt ? 'Comprar' : 'Buy')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'free' && (
            <>
              <p className="foot-note" style={{ marginBottom: 10 }}>
                {pt
                  ? 'Retire um anúncio que já não precisa. Ele não é apagado — fica guardado e pode voltar quando houver espaço.'
                  : 'Take down a listing you no longer need. It is not deleted — it is kept, and can come back when there is room.'}
              </p>
              <div className="gate-listings">
                {listings.map((l) => (
                  <div key={l.id} className="gate-listing">
                    {l.cover
                      // eslint-disable-next-line @next/next/no-img-element -- a 52px Cloudinary thumbnail; next/image adds a request per row for no gain
                      ? <img src={l.cover} alt="" />
                      : <span className="gl-nophoto"><Icon name="home_work" size={16} /></span>}
                    <div className="gl-main">
                      <div className="br-title">{l.title}</div>
                      <div className="br-when">
                        {l.place}
                        {l.views > 0 && ` · ${l.views} ${pt ? 'visualizações' : 'views'}`}
                      </div>
                    </div>
                    <button
                      className="btn"
                      disabled={busy !== null}
                      onClick={() => freeSlot(l.id)}
                    >
                      {busy === l.id ? (pt ? 'A retirar…' : 'Taking down…') : (pt ? 'Retirar' : 'Take down')}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/*
          * The fourth way out, and the one that should always work.
          *
          * Upgrading, buying and freeing a slot all ask the agent to decide
          * something now. Saving a draft asks nothing: the listing is written
          * to their account, costs nothing, occupies no slot, and is waiting
          * when the money is. Without it, closing this panel means the work
          * only survives while the tab stays open — and an agent who has to
          * choose between paying this minute and retyping everything usually
          * chooses neither.
          */}
        <div className="gate-draft">
          <div>
            <div className="br-title">{pt ? 'Guardar como rascunho' : 'Save as a draft'}</div>
            <div className="br-when">
              {pt
                ? 'Fica guardado na sua conta, sem custo e sem ocupar espaço. Publique quando quiser.'
                : 'Kept in your account, free, and taking no slot. Publish it whenever you are ready.'}
            </div>
          </div>
          <button className="btn" disabled={busy !== null || savingDraft} onClick={onSaveDraft}>
            {savingDraft ? (pt ? 'A guardar…' : 'Saving…') : (pt ? 'Guardar' : 'Save')}
          </button>
        </div>

        <div className="vfoot">
          <button className="btn" onClick={onClose}>
            {pt ? 'Voltar ao anúncio' : 'Back to the listing'}
          </button>
          <span className="spacer" />
          <span className="hint">
            {pt ? 'Nada se perde — o anúncio fica aqui.' : 'Nothing is lost — your listing stays here.'}
          </span>
        </div>
      </div>
    </div>
  );
}
