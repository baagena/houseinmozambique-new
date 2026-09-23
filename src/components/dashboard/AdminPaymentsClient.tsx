'use client';

/**
 * The payments ledger.
 *
 * One row per payment, built around the question that actually gets asked of
 * it: somebody is on the phone holding a reference, a name or a number — what
 * is their situation? So the payer and their payment sit together in the first
 * two columns, the reference is copyable in one click because it gets pasted
 * into an M-Pesa statement search, and the status says not just whether money
 * arrived but whether what it bought is still running.
 *
 * Search, filters and paging are URL state, not component state: an admin who
 * finds a row and sends the link to a colleague should send them the row.
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StatTile from '@/components/dashboard/StatTile';
import {
  PAGE_SIZE,
  type AdminPayment,
  type FreeAgentRow,
  type PaymentFilter,
  type PaymentStats,
} from '@/lib/payments-view';

const FILTERS: { key: PaymentFilter; label: string }[] = [
  { key: 'all', label: 'All payments' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active subscriptions' },
  { key: 'expired', label: 'Expired' },
  { key: 'free', label: 'Free & comped' },
];

const METHOD_LABEL: Record<string, string> = {
  manual: 'Direct / transfer',
  mpesa: 'M-Pesa',
  emola: 'e-Mola',
  card: 'Card',
};

const money = (minor: number, cur: string) =>
  `${new Intl.NumberFormat('en-US').format(Math.round(minor / 100))} ${cur === 'MZN' ? 'MT' : cur}`;

/** day / month / year — stated in the legend so nobody reads 09/11 as September. */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** How far off an expiry is, in the words an admin would use out loud. */
function expiryNote(iso: string): { text: string; tone: '' | 'warn' | 'crit' } {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { text: `Ended ${Math.abs(days)}d ago`, tone: 'crit' };
  if (days === 0) return { text: 'Ends today', tone: 'warn' };
  if (days <= 7) return { text: `${days}d left`, tone: 'warn' };
  return { text: `Until ${fmtDate(iso)}`, tone: '' };
}

/**
 * A reference is long and nobody reads the middle of it. Showing the ends
 * keeps it recognisable against a receipt while the Copy button carries the
 * whole string.
 */
function shortRef(ref: string): string {
  return ref.length <= 22 ? ref : `${ref.slice(0, 10)}…${ref.slice(-5)}`;
}

function CopyRef({ value }: { value: string }) {
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
          // Blocked on insecure origins; the reference is on screen regardless.
        }
      }}
    >
      <Icon name={copied ? 'check' : 'content_copy'} size={13} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/** What this row's status means, as a pill plus the line under it. */
function statusOf(p: AdminPayment): { cls: string; label: string; note: string } {
  if (p.status === 'SUBMITTED') return { cls: 'warn', label: 'Proof in', note: 'Needs checking' };
  if (p.status === 'PENDING') return { cls: 'muted', label: 'Awaiting payment', note: 'Nothing sent yet' };
  if (p.status === 'REJECTED') return { cls: 'crit', label: 'Rejected', note: 'Payer was told why' };
  if (p.status === 'CANCELLED') return { cls: 'muted', label: 'Closed', note: 'Superseded — nobody owes it' };
  if (p.status === 'FAILED') return { cls: 'crit', label: 'Failed', note: 'Gateway declined it' };

  // COMPLETED — the money arrived; what matters now is what it bought.
  if (!p.granted) return { cls: 'warn', label: 'Paid', note: 'Nothing granted' };
  if (p.expiresAt) {
    const { text } = expiryNote(p.expiresAt);
    return p.live ? { cls: 'good', label: 'Active', note: text } : { cls: '', label: 'Expired', note: text };
  }
  return { cls: 'good', label: 'Active', note: 'Unused credit' };
}

/**
 * Accounts using the platform without paying for it.
 *
 * Same table furniture as the ledger so the page does not lurch when the pill
 * changes, but the columns answer different questions: not "did this settle"
 * but "how much are they getting, and did somebody give it to them".
 */
function FreeTable({ rows, query }: { rows: FreeAgentRow[]; query: string }) {
  return (
    <table className="pay-table">
      <thead>
        <tr>
          <th>Account</th>
          <th>Plan</th>
          <th>Listings used</th>
          <th>Since</th>
          <th>How</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((a) => {
          const unlimited = a.listingQuota === -1;
          const atLimit = !unlimited && a.listingQuota > 0 && a.listingsUsed >= a.listingQuota;
          return (
            <tr key={a.id}>
              <td>
                <div className="pt-name">{a.name}</div>
                <div className="pt-sub">{a.email}</div>
                {a.phone && <div className="pt-sub">{a.phone}</div>}
              </td>

              <td>
                <div className="pt-plan">
                  <span
                    className={`pt-chip${a.planName ? '' : ' is-none'}`}
                    style={a.planName ? { ['--h' as string]: a.planHue } : undefined}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="pt-name">{a.planName ?? 'No plan yet'}</div>
                    <div className="pt-sub">
                      {a.planName ? 'No charge' : 'Nothing granted'}
                      {unlimited ? ' · unlimited' : a.listingQuota > 0 ? ` · ${a.listingQuota} listing${a.listingQuota === 1 ? '' : 's'}` : ''}
                    </div>
                  </div>
                </div>
              </td>

              <td>
                <div className="pt-name">
                  {a.listingsUsed}{unlimited ? '' : ` / ${a.listingQuota}`}
                </div>
                {/* An account sitting at its free limit is the one worth a
                    conversation — it is the whole reason to look at this list. */}
                <div className={`pt-sub${atLimit ? ' is-warn' : ''}`}>
                  {atLimit ? 'At their limit' : a.listingsUsed === 0 ? 'Not listing yet' : 'Within quota'}
                </div>
              </td>

              <td>
                <div className="pt-sub">Joined: {fmtDate(a.joinedAt)}</div>
                {a.endsAt && <div className="pt-sub">Ends: {fmtDate(a.endsAt)}</div>}
              </td>

              <td>
                <span className={`pill ${a.comped ? 'warn' : 'muted'}`}>
                  {a.comped ? 'Comped' : a.planName ? 'Free tier' : 'None'}
                </span>
                {a.comped && a.grantedBy && <div className="pt-note">by {a.grantedBy}</div>}
                {a.grantNote && !a.grantNote.startsWith('Free tier') && (
                  <div className="pt-note">{a.grantNote}</div>
                )}
              </td>
            </tr>
          );
        })}

        {rows.length === 0 && (
          <tr>
            <td colSpan={5}>
              <div className="empty">
                <Icon name="group" size={22} />
                <p style={{ margin: '8px 0 0', fontWeight: 600, color: 'var(--d-text-1)' }}>
                  {query ? `No free account matches “${query}”` : 'Everybody is on a paid plan'}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)' }}>
                  Accounts appear here while they have no paid plan in force.
                </p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default function AdminPaymentsClient({
  payments, freeAgents, stats, query, filter, page, pageCount, total, graceDays,
}: {
  payments: AdminPayment[];
  freeAgents: FreeAgentRow[];
  stats: PaymentStats;
  query: string;
  filter: PaymentFilter;
  page: number;
  pageCount: number;
  total: number;
  graceDays: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = useState(query);

  /* The box follows the URL, so Back after a search puts the typed text back
     rather than leaving a box that disagrees with the rows beneath it.
     Adjusted during render rather than in an effect: an effect would paint one
     frame with the stale text before correcting it. */
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setTerm(query);
  }

  function go(next: { q?: string; filter?: PaymentFilter; page?: number }) {
    const sp = new URLSearchParams(params.toString());
    const set = (k: string, v: string | undefined) => (v ? sp.set(k, v) : sp.delete(k));

    if (next.q !== undefined) set('q', next.q.trim() || undefined);
    if (next.filter !== undefined) set('filter', next.filter === 'all' ? undefined : next.filter);
    // Any change of search or filter invalidates the page number: page 4 of a
    // new result set is usually empty, which reads as "no payments".
    set('page', next.page && next.page > 1 ? String(next.page) : undefined);

    router.push(`/dashboard/admin/payments${sp.toString() ? `?${sp}` : ''}`);
  }

  const isFree = filter === 'free';
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Money</p>
          <h1>{isFree ? 'Free & comped accounts' : 'All payments'}</h1>
          <p>
            {total === 0
              ? 'No payments match this view'
              : isFree
                ? `Showing ${from}–${to} of ${total} account${total === 1 ? '' : 's'} paying nothing`
                : `Showing ${from}–${to} of ${total} payment${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link className="btn primary" href="/dashboard/admin/payments/verify">
          <Icon name="inbox" size={15} />
          {stats.awaitingReview > 0
            ? `Verify ${stats.awaitingReview}`
            : 'Verify payments'}
        </Link>
      </div>

      {/* Search ---------------------------------------------------------- */}
      <form
        className="pay-search"
        onSubmit={(e) => { e.preventDefault(); go({ q: term, filter }); }}
      >
        <span className="pay-search-in">
          <Icon name="search" size={16} />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by payment ref, name, email or phone…"
            aria-label="Search payments"
          />
          {term && (
            <button type="button" onClick={() => { setTerm(''); go({ q: '', filter }); }} aria-label="Clear search">
              <Icon name="close" size={15} />
            </button>
          )}
        </span>
        <button type="submit" className="btn primary">Search</button>
      </form>

      <div className="pay-pills">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`pay-pill${filter === f.key ? ' on' : ''}`}
            onClick={() => go({ q: term, filter: f.key })}
          >
            {f.label}
            {f.key === 'pending' && stats.pending > 0 && <span className="pay-pill-n">{stats.pending}</span>}
            {f.key === 'free' && stats.free > 0 && <span className="pay-pill-n is-quiet">{stats.free}</span>}
          </button>
        ))}
      </div>

      <div className="stat-row">
        <StatTile
          label="Payments"
          value={stats.payments}
          icon="tag"
          hint="All recorded payment rows"
        />
        <StatTile
          label="Active"
          value={stats.active}
          icon="check_circle"
          tone={stats.active > 0 ? 'good' : 'default'}
          hint="Plans that are still valid"
        />
        <StatTile
          label="Expired"
          value={stats.expired}
          icon="schedule"
          hint="Past their end date"
        />
        <StatTile
          label="Total revenue"
          value={new Intl.NumberFormat('en-US').format(Math.round(stats.revenueMinor / 100))}
          unit="MT"
          icon="payments"
          hint="Confirmed payments only"
        />
      </div>

      <p className="pay-legend">
        <span>
          {isFree
            ? 'Accounts with no paid plan in force: the automatic free tier, and any account comped by an admin. '
            : ''}
          Dates are <strong>day / month / year</strong>. A plan stays usable for {graceDays} days
          after its end date.
        </span>
        {!isFree && <span className="hint">Click <strong>Copy</strong> to take the full reference.</span>}
      </p>

      {/* Table ----------------------------------------------------------- */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          {isFree ? <FreeTable rows={freeAgents} query={query} /> : (
          <table className="pay-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Payment ref</th>
                <th>Dates</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const s = statusOf(p);
                const ref = p.payerReference ?? p.orderRef;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="pt-name">{p.customerName}</div>
                      <div className="pt-sub">{p.customerEmail}</div>
                      {p.customerPhone && <div className="pt-sub">{p.customerPhone}</div>}
                    </td>

                    <td>
                      <div className="pt-plan">
                        <span
                          className="pt-chip"
                          style={{ ['--h' as string]: p.planHue }}
                          aria-hidden="true"
                        />
                        <div>
                          <div className="pt-name">{p.planName}</div>
                          <div className="pt-sub">
                            {money(p.amountMinor, p.currency)}
                            {p.settled ? ' paid' : ' due'}
                            {p.planKind === 'one_off'
                              ? ' · one listing'
                              : p.planInterval === 'year'
                                ? ' · yearly'
                                : ' · monthly'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="pt-ref">
                        <code title={ref}>{shortRef(ref)}</code>
                        <CopyRef value={ref} />
                      </div>
                      <div className="pt-sub">
                        {METHOD_LABEL[p.method] ?? p.method}
                        {p.payerReference && p.payerReference !== p.orderRef ? ' · their code' : ''}
                      </div>
                    </td>

                    <td>
                      <div className="pt-sub">
                        {p.settled ? 'Paid' : 'Raised'}: {fmtDate(p.paidAt)}
                      </div>
                      {p.expiresAt ? (
                        <div className="pt-sub">Expires: {fmtDate(p.expiresAt)}</div>
                      ) : p.granted ? (
                        <div className="pt-sub">No end date yet</div>
                      ) : null}
                    </td>

                    <td>
                      <span className={`pill ${s.cls}`}>{s.label}</span>
                      <div className={`pt-note${s.cls === 'crit' ? ' is-crit' : s.cls === 'warn' ? ' is-warn' : ''}`}>
                        {s.note}
                      </div>
                      {p.status === 'SUBMITTED' && (
                        <Link className="pt-review" href="/dashboard/admin/payments/verify">
                          Review →
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}

              {payments.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <Icon name="payments" size={22} />
                      <p style={{ margin: '8px 0 0', fontWeight: 600, color: 'var(--d-text-1)' }}>
                        {query ? `Nothing matches “${query}”` : 'Nothing in this view'}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)' }}>
                        {query
                          ? 'Try part of a reference, an email, or a phone number.'
                          : 'Payment references appear here once an agent chooses a plan.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>

        {pageCount > 1 && (
          <div className="pay-pager">
            <button
              className="btn"
              disabled={page <= 1}
              onClick={() => go({ q: term, filter, page: page - 1 })}
            >
              <Icon name="arrow_back" size={14} /> Previous
            </button>
            <span className="hint">Page {page} of {pageCount}</span>
            <button
              className="btn"
              disabled={page >= pageCount}
              onClick={() => go({ q: term, filter, page: page + 1 })}
            >
              Next <Icon name="arrow_forward" size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
