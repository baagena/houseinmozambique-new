'use client';

/**
 * Buyer requirements waiting to be released to the agents.
 *
 * Releasing is the only action that sends anything, and it sends to every
 * agent with a live paid plan at once. That is why it is a human decision and
 * why the button says how many people it is about to email — an action whose
 * blast radius is invisible is an action somebody will regret.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import StatTile from '@/components/dashboard/StatTile';

export interface AdminRequest {
  id: string;
  ref: string;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  anonymous: boolean;
  intent: string;
  propertyType: string | null;
  city: string;
  areas: string | null;
  budgetMinMinor: number | null;
  budgetMaxMinor: number | null;
  currency: string;
  minBeds: number | null;
  moveBy: string | null;
  notes: string | null;
  createdAt: string;
  broadcastAt: string | null;
  broadcastTo: number;
  responseCount: number;
  reviewedBy: string | null;
  reviewNote: string | null;
}

const FILTERS = [
  { key: 'PENDING', label: 'To release' },
  { key: 'OPEN', label: 'Out with agents' },
  { key: 'MATCHED', label: 'Being worked' },
  { key: 'ALL', label: 'All' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

const money = (minor: number | null, cur: string) =>
  minor === null ? null : `${new Intl.NumberFormat('en-US').format(Math.round(minor / 100))} ${cur === 'MZN' ? 'MT' : cur}`;

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function AdminRequestsClient({
  requests, paidAgentCount,
}: {
  requests: AdminRequest[];
  /** How many agents a release would reach right now. */
  paidAgentCount: number;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('PENDING');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const counts = FILTERS.reduce<Record<string, number>>((acc, f) => {
    acc[f.key] = f.key === 'ALL' ? requests.length : requests.filter((r) => r.status === f.key).length;
    return acc;
  }, {});

  const visible = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter);

  async function act(r: AdminRequest, action: 'release' | 'reject' | 'close', why = '') {
    setBusy(r.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/property-requests/${r.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: why }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'That did not go through.');
      setNotice(data.message ?? 'Done.');
      setRejecting(null);
      setNote('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not go through.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Demand</p>
          <h1>Property requests</h1>
          <p>
            Buyers who have said what they want. Releasing one emails every agent on a paid plan,
            so read it first.
          </p>
        </div>
      </div>

      {error && <div className="alert crit"><Icon name="error" size={18} /><div><div className="a-sub">{error}</div></div></div>}
      {notice && <div className="alert good"><Icon name="check_circle" size={18} /><div><div className="a-sub">{notice}</div></div></div>}

      {paidAgentCount === 0 && (
        <div className="alert warn">
          <Icon name="warning" size={18} />
          <div>
            <div className="a-title">No agent is on a paid plan</div>
            <div className="a-sub">
              Releasing a request will email nobody. It still appears on every agent&apos;s board,
              so the buyer is not stranded — but the paid fan-out has nobody to reach yet.
            </div>
          </div>
        </div>
      )}

      <div className="stat-row">
        <StatTile label="To release" value={counts.PENDING ?? 0} icon="inbox"
          tone={(counts.PENDING ?? 0) > 0 ? 'warn' : 'default'}
          hint={(counts.PENDING ?? 0) > 0 ? 'Buyers waiting on us' : 'Queue is clear'} />
        <StatTile label="Out with agents" value={counts.OPEN ?? 0} icon="send" hint="Released, nobody has answered" />
        <StatTile label="Being worked" value={counts.MATCHED ?? 0} icon="handshake" hint="An agent has responded" />
        <StatTile label="Reaches" value={paidAgentCount} icon="group" hint="Agents on a paid plan right now" />
      </div>

      <div className="pay-pills">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={`pay-pill${filter === f.key ? ' on' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
            {counts[f.key] ? <span className="pay-pill-n">{counts[f.key]}</span> : null}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <div className="empty">
            <Icon name="check_circle" size={26} />
            <span>{filter === 'PENDING' ? 'Nothing waiting to be released.' : 'Nothing here.'}</span>
          </div>
        </div>
      ) : (
        <div className="queue-grid">
          {visible.map((r) => {
            const b = [money(r.budgetMinMinor, r.currency), money(r.budgetMaxMinor, r.currency)].filter(Boolean).join(' – ');
            const isBusy = busy === r.id;
            return (
              <div key={r.id} className="card">
                <div className="card-head">
                  <div>
                    <h3>{r.name} {r.anonymous && <span className="pill muted">Anonymous</span>}</h3>
                    <p className="hint">{r.email}{r.phone ? ` · ${r.phone}` : ''} · {r.ref}</p>
                  </div>
                  <span className={`pill ${r.status === 'PENDING' ? 'warn' : r.status === 'MATCHED' ? 'good' : ''}`}>
                    {r.status === 'PENDING' ? 'To release' : r.status === 'OPEN' ? 'Out' : r.status === 'MATCHED' ? 'Worked' : r.status}
                  </span>
                </div>

                <div className="pay-body">
                  <div className="bh-value">
                    {r.intent === 'sale' ? 'Wants to buy' : r.intent === 'rent' ? 'Wants to rent' : 'Wants a short stay'}
                    <span className="bh-of"> · {[r.areas, r.city].filter(Boolean).join(', ')}</span>
                  </div>
                  <div className="bh-sub">Posted {fmt(r.createdAt)}</div>

                  <div className="pay-rows" style={{ marginTop: 13 }}>
                    {b && (
                      <div className="pay-row">
                        <span className="pay-row-k">Budget</span>
                        <span className="pay-row-v"><strong>{b}</strong></span>
                      </div>
                    )}
                    <div className="pay-row">
                      <span className="pay-row-k">Wants</span>
                      <span className="pay-row-v">
                        <strong>
                          {[r.propertyType ?? 'Any type', r.minBeds ? `${r.minBeds}+ beds` : null].filter(Boolean).join(' · ')}
                        </strong>
                      </span>
                    </div>
                    {r.broadcastAt && (
                      <div className="pay-row">
                        <span className="pay-row-k">Sent to</span>
                        <span className="pay-row-v">
                          <strong>{r.broadcastTo} agent{r.broadcastTo === 1 ? '' : 's'}</strong>
                          <em>{fmt(r.broadcastAt)}</em>
                        </span>
                      </div>
                    )}
                    {r.responseCount > 0 && (
                      <div className="pay-row">
                        <span className="pay-row-k">Answered by</span>
                        <span className="pay-row-v"><strong>{r.responseCount} agent{r.responseCount === 1 ? '' : 's'}</strong></span>
                      </div>
                    )}
                  </div>

                  {r.notes && <p className="pay-hint">“{r.notes}”</p>}
                  {r.reviewNote && <p className="pay-hint">{r.reviewedBy}: {r.reviewNote}</p>}

                  {rejecting === r.id ? (
                    <>
                      <label className="pay-field" style={{ marginTop: 12 }}>
                        <span className="pay-label">Why is it not usable?</span>
                        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} autoFocus
                          placeholder="e.g. no city given, or an obvious test entry" />
                      </label>
                      <div className="pay-actions">
                        <button className="btn danger" disabled={isBusy || !note.trim()} onClick={() => act(r, 'reject', note.trim())}>
                          {isBusy ? 'Rejecting…' : 'Confirm rejection'}
                        </button>
                        <button className="btn" disabled={isBusy} onClick={() => { setRejecting(null); setNote(''); }}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <div className="pay-actions">
                      {r.status === 'PENDING' && (
                        <button className="btn primary" disabled={isBusy} onClick={() => act(r, 'release')}>
                          {isBusy ? 'Releasing…' : `Release to ${paidAgentCount} agent${paidAgentCount === 1 ? '' : 's'}`}
                        </button>
                      )}
                      {r.status !== 'PENDING' && (
                        <button className="btn" disabled={isBusy} onClick={() => act(r, 'close')}>
                          {isBusy ? 'Closing…' : 'Close it'}
                        </button>
                      )}
                      {r.status === 'PENDING' && (
                        <button className="btn" disabled={isBusy} onClick={() => { setRejecting(r.id); setNote(''); }}>Reject</button>
                      )}
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
