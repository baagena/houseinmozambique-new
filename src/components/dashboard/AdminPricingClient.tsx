'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlanFeature, PricingPlanRecord } from '@/lib/pricing';

type PlanForm = Omit<PricingPlanRecord, 'id'> & { id?: string };

const emptyPlan: PlanForm = {
  slug: '',
  sortOrder: 0,
  isActive: true,
  highlighted: false,
  ctaMode: 'checkout',
  nameEn: '',
  namePt: '',
  descriptionEn: '',
  descriptionPt: '',
  priceEn: '',
  pricePt: '',
  unitEn: 'Mt / month',
  unitPt: 'Mt / mês',
  badgeEn: '',
  badgePt: '',
  ctaEn: 'Get Started',
  ctaPt: 'Começar',
  featuresEn: [],
  featuresPt: [],
};

const inputClass =
  'w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20';
const labelClass = 'block text-xs font-semibold text-[#374151] mb-1';

/** Renders the plan exactly as the public /pricing card does, so pricing edits are checkable before saving. */
function PlanPreview({ form, lang }: { form: PlanForm; lang: 'en' | 'pt' }) {
  const pt = lang === 'pt';
  const name = pt ? form.namePt || form.nameEn : form.nameEn;
  const description = pt ? form.descriptionPt || form.descriptionEn : form.descriptionEn;
  const price = pt ? form.pricePt || form.priceEn : form.priceEn;
  const unit = pt ? form.unitPt || form.unitEn : form.unitEn;
  const badge = pt ? form.badgePt || form.badgeEn : form.badgeEn;
  const cta = pt ? form.ctaPt || form.ctaEn : form.ctaEn;
  const features = (pt ? form.featuresPt : form.featuresEn).filter((f) => f.label.trim());

  if (!name && !price) {
    return (
      <div className="flex items-center justify-center h-40 rounded-xl border-2 border-dashed border-[#e0e0e0] text-[#aaa] text-sm">
        Fill in the plan to preview the card
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col p-8 rounded-xl relative ${
        form.highlighted ? 'bg-[#002045] text-white shadow-xl' : 'bg-white border border-[#eceef1]'
      }`}
    >
      {badge && (
        <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#845326] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
          {badge}
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-black mb-2 tracking-tight">{name || '—'}</h3>
        <p className={`text-xs ${form.highlighted ? 'text-[#fab983]/80' : 'text-[#74777f]'}`}>{description}</p>
      </div>
      <div className="mb-8">
        <span className="text-3xl font-black">{price || '—'}</span>
        <span className={`text-xs ml-2 ${form.highlighted ? 'text-[#fab983]/80' : 'text-[#74777f]'}`}>{unit}</span>
      </div>
      <ul className="mb-8 space-y-3 flex-grow">
        {features.map((f, i) => (
          <li
            key={`${f.label}-${i}`}
            className={`flex items-start gap-3 text-xs leading-relaxed ${!f.included ? 'opacity-40' : ''}`}
          >
            <span
              className={`material-symbols-outlined text-base flex-shrink-0 ${
                f.included ? (form.highlighted ? 'text-[#fab983]' : 'text-[#845326]') : 'text-[#74777f]'
              }`}
            >
              {f.included ? (f.star ? 'stars' : 'check_circle') : 'do_not_disturb_on'}
            </span>
            <span>{f.label}</span>
          </li>
        ))}
      </ul>
      <span
        className={`w-full py-3 rounded-lg font-bold text-center block text-sm ${
          form.highlighted ? 'bg-[#845326] text-white' : 'bg-[#f2f4f6] text-[#002045]'
        }`}
      >
        {cta || 'Get Started'}
      </span>
    </div>
  );
}

function FeatureEditor({
  features,
  onChange,
}: {
  features: PlanFeature[];
  onChange: (next: PlanFeature[]) => void;
}) {
  const update = (index: number, patch: Partial<PlanFeature>) =>
    onChange(features.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  return (
    <div className="space-y-2">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className={`${inputClass} flex-1`}
            value={f.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Up to 15 Listings"
          />
          <button
            type="button"
            title={f.included ? 'Included — click to show as unavailable' : 'Unavailable — click to include'}
            onClick={() => update(i, { included: !f.included })}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              f.included
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                : 'border-[#e0e0e0] bg-[#f5f6f8] text-[#9aa0a8]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {f.included ? 'check_circle' : 'do_not_disturb_on'}
            </span>
          </button>
          <button
            type="button"
            title={f.star ? 'Highlighted with a star' : 'Click to highlight with a star'}
            onClick={() => update(i, { star: !f.star })}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              f.star
                ? 'border-[#fab983] bg-[#fff6ec] text-[#845326]'
                : 'border-[#e0e0e0] bg-[#f5f6f8] text-[#9aa0a8]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">stars</span>
          </button>
          <button
            type="button"
            title="Remove feature"
            onClick={() => onChange(features.filter((_, index) => index !== i))}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9aa0a8] hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...features, { label: '', included: true, star: false }])}
        className="flex items-center gap-1.5 text-[13px] font-medium text-[#002045] hover:underline"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Add feature
      </button>
    </div>
  );
}

export default function AdminPricingClient({ plans: initial }: { plans: PricingPlanRecord[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlanRecord[]>(initial);
  const [form, setForm] = useState<PlanForm>(emptyPlan);
  const [lang, setLang] = useState<'en' | 'pt'>('en');
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const set = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function openNew() {
    setForm({ ...emptyPlan, sortOrder: plans.length });
    setEditing(false);
    setError('');
    setLang('en');
    setShowForm(true);
  }

  function openEdit(plan: PricingPlanRecord) {
    setForm({ ...plan, badgeEn: plan.badgeEn ?? '', badgePt: plan.badgePt ?? '' });
    setEditing(true);
    setError('');
    setLang('en');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setShowForm(false);
    setForm(emptyPlan);
    setEditing(false);
    setError('');
  }

  async function handleSave() {
    if (!form.nameEn.trim()) { setError('An English plan name is required.'); return; }
    if (!form.priceEn.trim()) { setError('A price is required — it can be any text, e.g. "3,000 - 5,000" or "Free".'); return; }

    const slug = form.slug.trim() || form.nameEn.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');

    setSaving(true);
    setError('');
    try {
      const url = editing && form.id ? `/api/admin/pricing/${form.id}` : '/api/admin/pricing';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slug }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to save the plan.');

      setPlans((prev) =>
        editing ? prev.map((p) => (p.id === payload.id ? payload : p)) : [...prev, payload]
      );
      closeForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(plan: PricingPlanRecord) {
    if (!confirm(`Delete the "${plan.nameEn}" plan? It will disappear from the pricing page.`)) return;
    setDeleting(plan.id);
    try {
      const res = await fetch(`/api/admin/pricing/${plan.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      router.refresh();
    } catch {
      setError('Could not delete that plan. Please try again.');
    } finally {
      setDeleting(null);
    }
  }

  async function toggleActive(plan: PricingPlanRecord) {
    const res = await fetch(`/api/admin/pricing/${plan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...plan, isActive: !plan.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
      router.refresh();
    }
  }

  const pt = lang === 'pt';

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#002045] tracking-tight">Pricing plans</h1>
          <p className="text-sm text-[#74777f] mt-1">
            Edit the plans and prices shown on the public pricing page, in English and Portuguese.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-[#002045] text-white px-3.5 py-2 rounded-lg font-medium text-[13px] hover:bg-[#0a2f5c] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New plan
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total plans', value: plans.length, icon: 'sell' },
          { label: 'Live on site', value: plans.filter((p) => p.isActive).length, icon: 'check_circle', color: 'text-emerald-600' },
          { label: 'Hidden', value: plans.filter((p) => !p.isActive).length, icon: 'visibility_off', color: 'text-amber-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl px-5 py-4 border border-[#eceef1]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`material-symbols-outlined text-[20px] ${s.color ?? 'text-[#002045]'}`}>{s.icon}</span>
              <span className="text-[13px] text-[#74777f] font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-semibold text-[#002045] tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {error && !showForm && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Form panel */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[#eceef1] overflow-hidden">
          <div className="flex items-center justify-between px-5 h-12 border-b border-[#eceef1]">
            <h2 className="text-sm font-semibold text-[#002045]">
              {editing ? `Edit plan — ${form.nameEn || form.slug}` : 'Create new plan'}
            </h2>
            <button
              onClick={closeForm}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#9aa0a8] hover:bg-[#f5f6f8] hover:text-[#002045]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: fields */}
            <div className="space-y-4">
              {/* Language switch */}
              <div className="flex items-center gap-1 rounded-lg bg-[#f5f6f8] p-1 w-fit">
                {(['en', 'pt'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                      lang === code ? 'bg-white text-[#002045] shadow-sm' : 'text-[#74777f] hover:text-[#002045]'
                    }`}
                  >
                    {code === 'en' ? 'English' : 'Português'}
                  </button>
                ))}
              </div>

              <div>
                <label className={labelClass}>Plan name * {pt && <span className="text-[#9aa0a8]">(PT)</span>}</label>
                <input
                  className={inputClass}
                  value={pt ? form.namePt : form.nameEn}
                  onChange={(e) => set(pt ? 'namePt' : 'nameEn', e.target.value)}
                  placeholder={pt ? 'Premium' : 'Premium'}
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <input
                  className={inputClass}
                  value={pt ? form.descriptionPt : form.descriptionEn}
                  onChange={(e) => set(pt ? 'descriptionPt' : 'descriptionEn', e.target.value)}
                  placeholder="For small real estate agencies wanting to establish their presence."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Price *</label>
                  <input
                    className={inputClass}
                    value={pt ? form.pricePt : form.priceEn}
                    onChange={(e) => set(pt ? 'pricePt' : 'priceEn', e.target.value)}
                    placeholder="3,000 - 5,000"
                  />
                  <p className="mt-1 text-[11px] text-[#9aa0a8]">Free text — a range, a single figure, or “Free”.</p>
                </div>
                <div>
                  <label className={labelClass}>Price unit</label>
                  <input
                    className={inputClass}
                    value={pt ? form.unitPt : form.unitEn}
                    onChange={(e) => set(pt ? 'unitPt' : 'unitEn', e.target.value)}
                    placeholder={pt ? 'Mt / mês' : 'Mt / month'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Corner badge</label>
                  <input
                    className={inputClass}
                    value={(pt ? form.badgePt : form.badgeEn) ?? ''}
                    onChange={(e) => set(pt ? 'badgePt' : 'badgeEn', e.target.value)}
                    placeholder="Popular"
                  />
                </div>
                <div>
                  <label className={labelClass}>Button label</label>
                  <input
                    className={inputClass}
                    value={pt ? form.ctaPt : form.ctaEn}
                    onChange={(e) => set(pt ? 'ctaPt' : 'ctaEn', e.target.value)}
                    placeholder={pt ? 'Começar' : 'Get Started'}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Features {pt ? '(Português)' : '(English)'}</label>
                <FeatureEditor
                  features={pt ? form.featuresPt : form.featuresEn}
                  onChange={(next) => set(pt ? 'featuresPt' : 'featuresEn', next)}
                />
              </div>

              <div className="border-t border-[#eceef1] pt-4 space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa0a8]">
                  Settings (shared by both languages)
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Plan key</label>
                    <input
                      className={inputClass}
                      value={form.slug}
                      onChange={(e) => set('slug', e.target.value)}
                      placeholder="premium"
                    />
                    <p className="mt-1 text-[11px] text-[#9aa0a8]">Used in checkout links. Lowercase, no spaces.</p>
                  </div>
                  <div>
                    <label className={labelClass}>Display order</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={form.sortOrder}
                      onChange={(e) => set('sortOrder', Number(e.target.value))}
                    />
                    <p className="mt-1 text-[11px] text-[#9aa0a8]">Lowest number shows first.</p>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Button action</label>
                  <select
                    className={inputClass}
                    value={form.ctaMode}
                    onChange={(e) => set('ctaMode', e.target.value === 'contact' ? 'contact' : 'checkout')}
                  >
                    <option value="checkout">Start a listing (sends to post a property)</option>
                    <option value="contact">Contact sales (sends to the contact page)</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-[13px] font-medium text-[#374151]">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => set('isActive', e.target.checked)}
                      className="h-4 w-4 accent-[#002045]"
                    />
                    Show on the pricing page
                  </label>
                  <label className="flex items-center gap-2 text-[13px] font-medium text-[#374151]">
                    <input
                      type="checkbox"
                      checked={form.highlighted}
                      onChange={(e) => set('highlighted', e.target.checked)}
                      className="h-4 w-4 accent-[#002045]"
                    />
                    Highlight this plan (dark card)
                  </label>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-[#002045] text-white px-4 py-2.5 rounded-lg font-medium text-[13px] hover:bg-[#0a2f5c] transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create plan'}
                </button>
                <button
                  onClick={closeForm}
                  className="px-4 py-2.5 rounded-lg border border-[#e0e0e0] text-[#374151] font-medium text-[13px] hover:bg-[#f5f6f8] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Right: live preview */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa0a8] mb-3">
                Live preview — {pt ? 'Português' : 'English'}
              </p>
              <div className="rounded-2xl bg-[#f7f9fb] p-6">
                <PlanPreview form={form} lang={lang} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan list */}
      <div className="space-y-3">
        {plans.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#e0e0e0] bg-white px-6 py-10 text-center text-sm text-[#9aa0a8]">
            No plans yet. Create one to populate the pricing page.
          </div>
        )}

        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-wrap items-center gap-4 bg-white rounded-xl border border-[#eceef1] px-5 py-4"
          >
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-[#002045]">{plan.nameEn}</p>
                {plan.highlighted && (
                  <span className="rounded-full bg-[#002045] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#fab983]">
                    Highlighted
                  </span>
                )}
                {plan.badgeEn && (
                  <span className="rounded-full bg-[#845326] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {plan.badgeEn}
                  </span>
                )}
                {!plan.isActive && (
                  <span className="rounded-full bg-[#f5f6f8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9aa0a8]">
                    Hidden
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#74777f] mt-0.5">
                {plan.slug} · {plan.featuresEn.length} features · order {plan.sortOrder}
              </p>
            </div>

            <div className="min-w-[140px]">
              <p className="text-sm font-semibold text-[#002045] tabular-nums">{plan.priceEn}</p>
              <p className="text-[12px] text-[#74777f]">{plan.unitEn || '—'}</p>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={() => toggleActive(plan)}
                title={plan.isActive ? 'Hide from the pricing page' : 'Show on the pricing page'}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9aa0a8] hover:bg-[#f5f6f8] hover:text-[#002045] transition-colors"
              >
                <span className="material-symbols-outlined text-[19px]">
                  {plan.isActive ? 'visibility' : 'visibility_off'}
                </span>
              </button>
              <button
                onClick={() => openEdit(plan)}
                className="flex items-center gap-1.5 rounded-lg border border-[#e0e0e0] px-3 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#f5f6f8] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </button>
              <button
                onClick={() => handleDelete(plan)}
                disabled={deleting === plan.id}
                title="Delete plan"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9aa0a8] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[19px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
