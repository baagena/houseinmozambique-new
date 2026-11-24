'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CorporateAccessState } from '@/lib/corporate-access';

interface AccessPlan {
  slug: string;
  name: string;
}

const TRIAL_DAYS = [7, 14, 30, 60, 90];
const MONTHS = [1, 2, 3, 6, 12];

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Activates a corporate agency and controls how long it stays listed.
 *
 * Agencies are verified and activated without paying first: staff start a free
 * trial with an end date, and when the agency pays (outside the platform) they
 * extend it by a number of months here. When the end date passes the agency
 * leaves the directory automatically; staff can also deactivate it at once.
 */
export default function AdminCorporateAccess({
  agentId,
  plans,
  state,
  until,
  currentPlanSlug,
  emailVerified,
}: {
  agentId: string;
  plans: AccessPlan[];
  state: CorporateAccessState;
  until: string | null;
  currentPlanSlug: string | null;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const running = state === 'TRIAL' || state === 'ACTIVE';
  const [mode, setMode] = useState<'trial' | 'months'>(running ? 'months' : 'trial');
  const [slug, setSlug] = useState(
    plans.find((p) => p.slug === currentPlanSlug)?.slug ?? plans[0]?.slug ?? '',
  );
  const [trialDays, setTrialDays] = useState(30);
  const [months, setMonths] = useState(1);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(method: 'POST' | 'DELETE') {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/agent/${agentId}/plan`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST'
          ? JSON.stringify({ planSlug: slug, months, trialDays: mode === 'trial' ? trialDays : undefined, note })
          : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save.');
      setMessage({ ok: true, text: method === 'DELETE' ? 'Agency deactivated. It is no longer listed.' : 'Saved. The agency is listed until the date shown.' });
      setNote('');
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not save.' });
    } finally {
      setBusy(false);
    }
  }

  function deactivate() {
    if (!confirm('Deactivate this agency now? It will be removed from the public directory.')) return;
    void send('DELETE');
  }

  const field = 'w-full rounded-lg border border-[#e3e5e8] bg-white px-3 py-2 text-[13px] text-[#002045] outline-none focus:border-[#002045]';

  const status = (() => {
    switch (state) {
      case 'TRIAL': return { tone: 'bg-emerald-50 text-emerald-800', text: `Active on a free trial until ${fmtDate(until!)}.` };
      case 'ACTIVE': return { tone: 'bg-emerald-50 text-emerald-800', text: `Active until ${fmtDate(until!)}.` };
      case 'ENDED': return { tone: 'bg-red-50 text-red-700', text: `Inactive — access ended ${until ? fmtDate(until) : ''}. The agency is no longer listed.` };
      case 'DEACTIVATED': return { tone: 'bg-red-50 text-red-700', text: 'Deactivated by staff. The agency is not listed.' };
      case 'DEMO': return { tone: 'bg-sky-50 text-sky-700', text: 'Demo account (development preview only).' };
      default: return { tone: 'bg-amber-50 text-amber-800', text: 'Not activated yet. Review the agency details below, then start a free trial.' };
    }
  })();

  const actionLabel = mode === 'trial'
    ? running ? `Add ${trialDays}-day trial` : `Verify & start ${trialDays}-day trial`
    : running ? `Extend by ${months} month${months === 1 ? '' : 's'}` : `Activate for ${months} month${months === 1 ? '' : 's'}`;

  return (
    <section className="rounded-3xl border border-[#f2f4f6] bg-white p-6 shadow-sm">
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#845326]">Agency access</p>
      <p className={`rounded-xl px-3 py-2.5 text-[13px] font-medium ${status.tone}`}>{status.text}</p>
      {!emailVerified && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[12px] text-amber-800">
          The login email is not confirmed yet, so the agency will not appear in the directory even when active. Confirm it in Manage agents → Edit → Email verified.
        </p>
      )}

      <div className="mt-4 inline-flex rounded-lg border border-[#e3e5e8] p-0.5" role="radiogroup" aria-label="Access type">
        {([['trial', 'Free trial'], ['months', 'Subscription months']] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${mode === value ? 'bg-[#002045] text-white' : 'text-[#5b616b] hover:text-[#002045]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
        <select className={field} value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Plan (sets listing limits)">
          {plans.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
        </select>
        {mode === 'trial' ? (
          <select className={field} value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value))} aria-label="Trial length">
            {TRIAL_DAYS.map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
        ) : (
          <select className={field} value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="Months">
            {MONTHS.map((m) => <option key={m} value={m}>{m} month{m === 1 ? '' : 's'}</option>)}
          </select>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-[#74777f]">
        {running
          ? 'Added on top of the current end date. The plan sets the agency’s listing limits.'
          : 'Starts today. The plan sets the agency’s listing limits.'}
      </p>
      <input
        className={`${field} mt-3`}
        placeholder="Optional internal note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={200}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void send('POST')}
          disabled={busy || !slug || state === 'DEMO'}
          className="rounded-lg bg-[#002045] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0a2f5c] disabled:opacity-50"
        >
          {busy ? 'Saving…' : actionLabel}
        </button>
        {running && (
          <button
            type="button"
            onClick={deactivate}
            disabled={busy}
            className="rounded-lg border border-red-200 px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Deactivate now
          </button>
        )}
        {message && <span className={`text-[13px] font-medium ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</span>}
      </div>
      {plans.length === 0 && (
        <p className="mt-2 text-[12px] text-red-600">No monthly or annual plan is active. Add one under Pricing first.</p>
      )}
    </section>
  );
}
