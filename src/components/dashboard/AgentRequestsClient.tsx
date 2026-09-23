'use client';

/**
 * Buyers looking for property, as work an agent can pick up.
 *
 * The reason a subscription is worth renewing. Listing slots buy the chance to
 * be found; this board hands the agent somebody who has already said what they
 * want and how much they will pay.
 *
 * Responding is the only action, and it does two things at once: it tells the
 * buyer somebody is on it, and it releases the contact details of a buyer who
 * asked to stay anonymous. That pairing is deliberate — the details are the
 * reward for engaging, not a list to harvest.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatTile from '@/components/dashboard/StatTile';
import { useLanguage } from '@/components/i18n/LanguageContext';
import type { AgentRequestView } from '@/lib/property-requests';

const INTENT: Record<string, { en: string; pt: string }> = {
  rent: { en: 'Looking to rent', pt: 'Quer arrendar' },
  sale: { en: 'Looking to buy', pt: 'Quer comprar' },
  'short stay': { en: 'Wants a short stay', pt: 'Quer estadia curta' },
};

function money(minor: number | null, currency: string): string | null {
  if (minor === null) return null;
  return `${new Intl.NumberFormat('en-US').format(Math.round(minor / 100))} ${currency === 'MZN' ? 'MT' : currency}`;
}

function budget(r: AgentRequestView, pt: boolean): string | null {
  const lo = money(r.budgetMinMinor, r.currency);
  const hi = money(r.budgetMaxMinor, r.currency);
  if (lo && hi) return `${lo} – ${hi}`;
  if (hi) return pt ? `até ${hi}` : `up to ${hi}`;
  if (lo) return pt ? `desde ${lo}` : `from ${lo}`;
  return null;
}

/** "2 days ago" — how long this buyer has been waiting on somebody. */
function waited(iso: string, pt: boolean): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return pt ? 'agora mesmo' : 'just now';
  if (h < 24) return pt ? `há ${h}h` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return pt ? `há ${d} dia${d === 1 ? '' : 's'}` : `${d} day${d === 1 ? '' : 's'} ago`;
}

export default function AgentRequestsClient({
  requests, paid, delayHours,
}: {
  requests: AgentRequestView[];
  paid: boolean;
  delayHours: number;
}) {
  const router = useRouter();
  const { lang } = useLanguage();
  const pt = lang === 'pt';

  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const unanswered = requests.filter((r) => !r.answered).length;

  async function respond(r: AgentRequestView) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/property-requests/${r.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send that.');
      setNotice(
        data.edited
          ? (pt ? 'Resposta actualizada.' : 'Your response was updated.')
          : (pt ? 'Resposta enviada — os contactos do comprador estão agora visíveis.' : 'Response sent — the buyer’s contact details are now visible.'),
      );
      setOpenId(null);
      setMessage('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send that.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{pt ? 'Procura' : 'Demand'}</p>
          <h1>{pt ? 'Quem está à procura' : 'Buyers looking'}</h1>
          <p>
            {pt
              ? 'Pessoas que disseram o que procuram. Responda e os contactos ficam seus.'
              : 'People who have said what they want. Respond and the contact details are yours.'}
          </p>
        </div>
      </div>

      {/* The commercial point, stated plainly to the agent it applies to. */}
      {!paid && (
        <div className="alert warn">
          <Icon name="schedule" size={18} />
          <div>
            <div className="a-title">
              {pt ? `Vê os pedidos ${delayHours}h depois dos planos pagos` : `You see requests ${delayHours}h after paid plans do`}
            </div>
            <div className="a-sub">
              {pt
                ? 'Os agentes com plano activo recebem cada pedido por e-mail assim que é publicado. '
                : 'Agents on an active plan are emailed every request the moment it is released. '}
              <Link className="link" href="/dashboard/agent/billing">
                {pt ? 'Ver planos' : 'See plans'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {error && <div className="alert crit"><Icon name="error" size={18} /><div><div className="a-sub">{error}</div></div></div>}
      {notice && <div className="alert good"><Icon name="check_circle" size={18} /><div><div className="a-sub">{notice}</div></div></div>}

      <div className="stat-row">
        <StatTile
          label={pt ? 'Por responder' : 'Unanswered'}
          value={unanswered}
          icon="inbox"
          tone={unanswered > 0 ? 'warn' : 'default'}
          hint={pt ? 'Ninguém pegou ainda' : 'Nobody has picked these up'}
        />
        <StatTile
          label={pt ? 'Já respondeu' : 'You answered'}
          value={requests.filter((r) => r.answered).length}
          icon="check_circle"
          hint={pt ? 'Contactos visíveis' : 'Contacts visible to you'}
        />
        <StatTile
          label={pt ? 'Total aberto' : 'Open in total'}
          value={requests.length}
          icon="group"
          hint={pt ? 'Pedidos activos' : 'Live requests'}
        />
      </div>

      {requests.length === 0 ? (
        <div className="card">
          <div className="empty">
            <Icon name="group" size={26} />
            <p style={{ margin: '8px 0 0', fontWeight: 600, color: 'var(--d-text-1)' }}>
              {pt ? 'Ainda não há pedidos' : 'No requests yet'}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)' }}>
              {pt
                ? 'Quando alguém disser o que procura, aparece aqui.'
                : 'When somebody posts what they are looking for, it appears here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="queue-grid">
          {requests.map((r) => {
            const b = budget(r, pt);
            return (
              <div key={r.id} className="card">
                <div className="card-head">
                  <div>
                    <h3>{(pt ? INTENT[r.intent]?.pt : INTENT[r.intent]?.en) ?? r.intent}</h3>
                    <p className="hint">
                      {[r.areas, r.city].filter(Boolean).join(' · ')} · {waited(r.createdAt, pt)}
                    </p>
                  </div>
                  <span className={`pill ${r.answered ? 'good' : 'warn'}`}>
                    {r.answered ? (pt ? 'Respondeu' : 'Answered') : (pt ? 'Por responder' : 'Open')}
                  </span>
                </div>

                <div className="pay-body">
                  <div className="pay-rows">
                    {b && (
                      <div className="pay-row">
                        <span className="pay-row-k">{pt ? 'Orçamento' : 'Budget'}</span>
                        <span className="pay-row-v"><strong>{b}</strong></span>
                      </div>
                    )}
                    {(r.minBeds || r.propertyType) && (
                      <div className="pay-row">
                        <span className="pay-row-k">{pt ? 'Procura' : 'Wants'}</span>
                        <span className="pay-row-v">
                          <strong>
                            {[r.propertyType, r.minBeds ? `${r.minBeds}+ ${pt ? 'quartos' : 'beds'}` : null]
                              .filter(Boolean).join(' · ')}
                          </strong>
                        </span>
                      </div>
                    )}
                    {r.moveBy && (
                      <div className="pay-row">
                        <span className="pay-row-k">{pt ? 'Entrar até' : 'Move by'}</span>
                        <span className="pay-row-v">
                          <strong>{new Date(r.moveBy).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        </span>
                      </div>
                    )}

                    {/* Contact: the reward for responding, not a list to scrape. */}
                    <div className="pay-row">
                      <span className="pay-row-k">{pt ? 'Contacto' : 'Contact'}</span>
                      <span className="pay-row-v">
                        {r.name ? (
                          <strong>
                            {r.name}{r.phone ? ` · ${r.phone}` : ''}{r.email ? ` · ${r.email}` : ''}
                          </strong>
                        ) : (
                          <em>{pt ? 'visível depois de responder' : 'visible once you respond'}</em>
                        )}
                      </span>
                    </div>
                  </div>

                  {r.notes && <p className="pay-hint">“{r.notes}”</p>}

                  {r.responseCount > 0 && (
                    <p className="pay-hint">
                      {pt
                        ? `${r.responseCount} agente(s) já respondeu.`
                        : `${r.responseCount} agent${r.responseCount === 1 ? ' has' : 's have'} responded.`}
                    </p>
                  )}

                  {openId === r.id ? (
                    <>
                      <label className="pay-field">
                        <span className="pay-label">{pt ? 'O que tem para esta pessoa?' : 'What do you have for them?'}</span>
                        <input
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          maxLength={1000}
                          autoFocus
                          placeholder={pt ? 'ex. T3 mobilado na Costa do Sol, 45 000 MT' : 'e.g. furnished 3-bed in Costa do Sol, 45,000 MT'}
                        />
                      </label>
                      <div className="pay-actions">
                        <button className="btn primary" disabled={busy} onClick={() => respond(r)}>
                          {busy ? (pt ? 'A enviar…' : 'Sending…') : (pt ? 'Enviar resposta' : 'Send response')}
                        </button>
                        <button className="btn" disabled={busy} onClick={() => { setOpenId(null); setMessage(''); }}>
                          {pt ? 'Cancelar' : 'Cancel'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="pay-actions">
                      <button
                        className={`btn${r.answered ? '' : ' primary'}`}
                        onClick={() => { setOpenId(r.id); setMessage(''); setError(null); }}
                      >
                        {r.answered
                          ? (pt ? 'Actualizar a resposta' : 'Update your response')
                          : (pt ? 'Tenho algo para si' : 'I have something for them')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
