'use client';

/**
 * Verify payments — the human half of settlement.
 *
 * Built around one question per row: does this claim match the statement? So
 * the code the payer typed and the number they sent from are the loudest things
 * on the card, not the plan name, and the screenshot opens at full size in one
 * click because a thumbnail of an M-Pesa SMS is unreadable.
 *
 * Approving is one button and rejecting is two, deliberately. Approval is
 * reversible in effect — a wrongly granted month can be cancelled — while a
 * rejection sends the payer an email saying their money was not found, so it
 * has to carry a reason and cannot be a mis-click.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import StatTile from '@/components/dashboard/StatTile';

export interface VerifyPayment {
  id: string;
  orderRef: string;
  amountMinor: number;
  currency: string;
  method: string;
  planType: string;
  planName: string | null;
  planPriceMinor: number | null;
  planMissing: boolean;
  status: string;
  agentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  payerReference: string | null;
  payerMsisdn: string | null;
  proofUrl: string | null;
  proofNote: string | null;
  transactionId: string | null;
  submittedAt: string | null;
  createdAt: string;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

const money = (minor: number, cur: string) =>
  `${cur === 'MZN' ? 'MT' : cur} ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(minor / 100)}`;

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

/** "3 days" — how long this person has been waiting on us. */
function waitingFor(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Copies the payer's code, which is what gets pasted into the statement search. */
function Copy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`copy-btn${copied ? ' is-done' : ''}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Blocked on insecure origins; the value is on screen regardless.
        }
      }}
    >
      <Icon name={copied ? 'check' : 'content_copy'} size={14} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

const FILTERS = [
  { key: 'SUBMITTED', label: 'Waiting on us' },
  { key: 'PENDING', label: 'Not paid yet' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All open' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export default function AdminVerifyPaymentsClient({
  payments, settledToday, destinationConfigured,
}: {
  payments: VerifyPayment[];
  settledToday: number;
  destinationConfigured: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('SUBMITTED');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /** Which row has its reject box open, and what has been typed into it. */
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  /** Per-row override of the amount actually received, in major units. */
  const [received, setReceived] = useState<Record<string, string>>({});
  /** Which row has that override open. */
  const [amending, setAmending] = useState<string | null>(null);

  const counts = useMemo(() => {
    const out: Record<string, number> = { ALL: payments.length };
    for (const f of FILTERS) {
      if (f.key === 'ALL') continue;
      out[f.key] = payments.filter((p) => p.status === f.key).length;
    }
    return out;
  }, [payments]);

  const visible = filter === 'ALL' ? payments : payments.filter((p) => p.status === filter);

  const owedMinor = payments
    .filter((p) => p.status === 'SUBMITTED')
    .reduce((sum, p) => sum + p.amountMinor, 0);

  async function act(payment: VerifyPayment, action: 'approve' | 'reject', note: string) {
    setBusy(payment.id);
    setError(null);
    setNotice(null);
    try {
      const raw = received[payment.id];
      const parsed = raw ? Number(raw.replace(',', '.')) : NaN;
      const receivedMinor =
        action === 'approve' && Number.isFinite(parsed) && parsed > 0
          ? Math.round(parsed * 100)
          : undefined;

      const res = await fetch(`/api/admin/payments/${payment.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note, receivedMinor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'That did not go through.');

      /*
       * A settled payment that granted nothing is the failure worth shouting
       * about: the agent has been emailed that their plan is active while
       * their quota has not moved. The route reports it and this surfaces it
       * rather than showing a green tick.
       */
      setNotice(data.message ?? 'Done.');
      if (action === 'approve' && data.granted === false) {
        setError(data.message ?? 'Payment settled but nothing was granted.');
        setNotice(null);
      }
      setRejecting(null);
      setRejectNote('');
      setAmending(null);
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
          <p className="eyebrow">Money</p>
          <h1>Verify payments</h1>
          <p>
            Payments sent straight to M-Pesa, e-Mola or the bank. Match the reference against the
            statement, then approve — approving applies the plan.
          </p>
        </div>
      </div>

      {!destinationConfigured && (
        <div className="alert warn">
          <Icon name="warning" size={18} />
          <div>
            <div className="a-title">No payment destination is published</div>
            <div className="a-sub">
              Agents are being shown a reference with nowhere to send it. Add the M-Pesa number or
              bank account under Platform → Account &amp; team.
            </div>
          </div>
        </div>
      )}

      <div className="stat-row">
        <StatTile
          label="Waiting on us"
          value={String(counts.SUBMITTED ?? 0)}
          icon="inbox"
          hint={counts.SUBMITTED ? 'Proof submitted, not yet checked' : 'Nothing to check'}
        />
        <StatTile
          label="Value in the queue"
          value={new Intl.NumberFormat('en-US').format(Math.round(owedMinor / 100))}
          unit="MT"
          icon="payments"
          hint="Claimed but not yet confirmed"
        />
        <StatTile
          label="Awaiting payment"
          value={String(counts.PENDING ?? 0)}
          icon="schedule"
          hint="Reference issued, nothing sent"
        />
        <StatTile
          label="Confirmed today"
          value={String(settledToday)}
          icon="check_circle"
          hint="Settled since midnight"
        />
      </div>

      {error && (
        <div className="alert crit">
          <Icon name="error" size={18} />
          <div><div className="a-sub">{error}</div></div>
        </div>
      )}
      {notice && (
        <div className="alert good">
          <Icon name="check_circle" size={18} />
          <div><div className="a-sub">{notice}</div></div>
        </div>
      )}

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`fchip${filter === f.key ? ' on' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {counts[f.key] ? <span className="cnt"> {counts[f.key]}</span> : null}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <div className="empty">
            <Icon name="check_circle" size={26} />
            <span>
              {filter === 'SUBMITTED'
                ? 'Nothing waiting. Every submitted payment has been checked.'
                : 'Nothing here.'}
            </span>
          </div>
        </div>
      ) : (
        <div className="queue-grid">
          {visible.map((p) => {
            const isBusy = busy === p.id;
            const priceMoved =
              p.planPriceMinor !== null && p.planPriceMinor !== p.amountMinor;

            return (
              <div key={p.id} className="card">
                <div className="card-head">
                  <div>
                    <h3>{p.customerName}</h3>
                    <p className="hint">{p.customerEmail}</p>
                  </div>
                  <span
                    className={`pill ${
                      p.status === 'SUBMITTED' ? 'warn' : p.status === 'REJECTED' ? 'crit' : ''
                    }`}
                  >
                    {p.status === 'SUBMITTED'
                      ? 'Proof in'
                      : p.status === 'REJECTED'
                        ? 'Rejected'
                        : 'Not paid'}
                  </span>
                </div>

                <div className="bh">
                  <div className="bh-value">
                    {money(p.amountMinor, p.currency)}
                    <span className="bh-of"> · {p.planName ?? p.planType}</span>
                  </div>
                  <div className="bh-sub">
                    {p.status === 'SUBMITTED' && p.submittedAt
                      ? `Submitted ${waitingFor(p.submittedAt)}`
                      : `Reference issued ${waitingFor(p.createdAt)}`}
                  </div>

                  {p.planMissing && (
                    <div className="alert crit" style={{ marginTop: 12 }}>
                      <Icon name="error" size={17} />
                      <div>
                        <div className="a-title">Plan “{p.planType}” no longer exists</div>
                        <div className="a-sub">
                          Approving will settle the payment but grant nothing. Recreate the plan
                          slug first, or grant the agent a period by hand.
                        </div>
                      </div>
                    </div>
                  )}

                  {priceMoved && !p.planMissing && (
                    <p className="fieldhint" style={{ marginTop: 10 }}>
                      This reference was issued at {money(p.amountMinor, p.currency)}; the plan now
                      costs {money(p.planPriceMinor!, p.currency)}. Collect the issued figure.
                    </p>
                  )}

                  <div className="pay-rows" style={{ marginTop: 13 }}>
                    <div className="pay-row">
                      <span className="pay-row-k">Their code</span>
                      <span className="pay-row-v">
                        {p.payerReference
                          ? <strong>{p.payerReference}</strong>
                          : <em>not given</em>}
                      </span>
                      {p.payerReference && <Copy value={p.payerReference} />}
                    </div>
                    <div className="pay-row">
                      <span className="pay-row-k">Sent from</span>
                      <span className="pay-row-v">
                        {p.payerMsisdn || p.customerPhone
                          ? <strong>{p.payerMsisdn || p.customerPhone}</strong>
                          : <em>not given</em>}
                      </span>
                    </div>
                  </div>

                  <p className="pay-hint">
                    {p.orderRef} · issued {fmtWhen(p.createdAt)}
                    {p.method !== 'manual' ? ` · ${p.method}` : ''}
                  </p>

                  {p.proofNote && (
                    <p className="askwhy" style={{ marginTop: 10 }}>
                      <strong>Their note:</strong> {p.proofNote}
                    </p>
                  )}

                  {p.proofUrl ? (
                    <a
                      href={p.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="proof-shot"
                      title="Open the full-size screenshot"
                    >
                      {/* Cloudinary-hosted, opened full size on click. next/image
                          would add a transform hop for an image that is looked at
                          once and never laid out against anything. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.proofUrl} alt={`Payment proof from ${p.customerName}`} />
                      <span className="proof-open">
                        <Icon name="open_in_new" size={13} /> Full size
                      </span>
                    </a>
                  ) : (
                    p.status === 'SUBMITTED' && (
                      <p className="fieldhint" style={{ marginTop: 10 }}>
                        No screenshot — match their code against the statement.
                      </p>
                    )
                  )}

                  {p.status === 'REJECTED' && p.reviewNote && (
                    <p className="fieldhint" style={{ marginTop: 10 }}>
                      Rejected by {p.reviewedBy ?? 'an admin'}
                      {p.reviewedAt ? ` on ${fmtWhen(p.reviewedAt)}` : ''}: {p.reviewNote}
                    </p>
                  )}

                  {/* The short-payment case, behind a line of text. Most
                      payments arrive in full, so a visible amount field on
                      every card reads as a step that must be completed.
                      (Approving a PENDING row is allowed either way: money
                      arrives without anyone submitting proof, and an admin who
                      can see it on the statement should not have to chase the
                      agent to click a form first.) */}
                  {amending === p.id ? (
                    <label className="pay-field" style={{ marginTop: 13 }}>
                      <span className="pay-label">Amount actually received ({p.currency})</span>
                      <input
                        value={received[p.id] ?? ''}
                        onChange={(e) => setReceived((r) => ({ ...r, [p.id]: e.target.value }))}
                        placeholder={(p.amountMinor / 100).toFixed(2)}
                        inputMode="decimal"
                        autoFocus
                      />
                      <span className="fieldhint">
                        Recorded on the payment, not enforced — the plan still applies in full.
                      </span>
                    </label>
                  ) : (
                    <button
                      type="button"
                      className="pay-more"
                      style={{ marginTop: 12 }}
                      onClick={() => setAmending(p.id)}
                    >
                      A different amount arrived
                      <Icon name="expand_more" size={14} />
                    </button>
                  )}

                  {rejecting === p.id ? (
                    <>
                      <label className="field" style={{ marginTop: 12 }}>
                        Why can it not be confirmed?
                        <textarea
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          rows={2}
                          maxLength={1000}
                          placeholder="e.g. no payment with this code on the statement for 20–22 Sept"
                        />
                        <span className="fieldhint">The payer is emailed exactly this.</span>
                      </label>
                      <div className="btn-row" style={{ marginTop: 12 }}>
                        <button
                          className="btn danger"
                          disabled={isBusy || !rejectNote.trim()}
                          onClick={() => act(p, 'reject', rejectNote.trim())}
                        >
                          {isBusy ? 'Rejecting…' : 'Confirm rejection'}
                        </button>
                        <button
                          className="btn"
                          disabled={isBusy}
                          onClick={() => { setRejecting(null); setRejectNote(''); }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="btn-row" style={{ marginTop: 14 }}>
                      <button
                        className="btn primary"
                        disabled={isBusy}
                        onClick={() => act(p, 'approve', '')}
                      >
                        {isBusy ? 'Confirming…' : 'Approve & apply plan'}
                      </button>
                      <button
                        className="btn"
                        disabled={isBusy}
                        onClick={() => { setRejecting(p.id); setRejectNote(''); }}
                      >
                        Reject
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
