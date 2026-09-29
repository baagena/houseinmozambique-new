'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GrantablePlan {
  slug: string;
  name: string;
  kind: string;
  price: string;
}

/**
 * Records a plan the team sold by hand. Single-listing plans add one listing
 * credit; monthly plans start or extend the subscription.
 */
export default function AdminGrantPlan({
  agentId,
  plans,
  currentPlan,
  credits,
}: {
  agentId: string;
  plans: GrantablePlan[];
  currentPlan: string | null;
  credits: number;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(plans[0]?.slug ?? '');
  const [months, setMonths] = useState(1);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const chosen = plans.find((p) => p.slug === slug);
  const monthly = chosen?.kind === 'subscription';

  async function grant() {
    if (!slug) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/agent/${agentId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug: slug, months, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not grant the plan.');
      setMessage({ ok: true, text: `${chosen?.name ?? 'Plan'} granted.` });
      setNote('');
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not grant the plan.' });
    } finally {
      setBusy(false);
    }
  }

  const field = 'w-full rounded-lg border border-[#e3e5e8] bg-white px-3 py-2 text-[13px] text-[#002045] outline-none focus:border-[#002045]';

  return (
    <section className="rounded-3xl border border-[#f2f4f6] bg-white p-6 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#845326] mb-1">Plan</p>
      <p className="text-sm text-[#002045]">
        Current plan: <b>{currentPlan ?? 'none'}</b>
        {credits > 0 && <> · <b>{credits}</b> unused single-listing credit{credits === 1 ? '' : 's'}</>}
      </p>
      <p className="mt-1 text-[12px] text-[#74777f]">
        Online payment is not set up yet, so plans requested through the contact form are recorded here once paid.
        Destaque and Super Destaque add one listing that is featured on the homepage; a monthly plan starts or extends the subscription.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_130px]">
        <select className={field} value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Plan">
          {plans.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name} — {p.price}</option>
          ))}
        </select>
        {monthly ? (
          <select className={field} value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="Months">
            {[1, 2, 3, 6, 12].map((m) => <option key={m} value={m}>{m} month{m === 1 ? '' : 's'}</option>)}
          </select>
        ) : <span className="hidden sm:block" />}
      </div>
      <input
        className={`${field} mt-3`}
        placeholder="Note, e.g. Paid by M-Pesa, ref ABC123"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={300}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={grant}
          disabled={busy || !slug}
          className="rounded-lg bg-[#002045] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0a2f5c] disabled:opacity-50"
        >
          {busy ? 'Granting…' : 'Grant plan'}
        </button>
        {message && (
          <span className={`text-[13px] font-medium ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</span>
        )}
      </div>
    </section>
  );
}
