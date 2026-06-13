'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Ad = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkText: string | null;
  position: string;
  type: string;
  bgColor: string | null;
  textColor: string | null;
  accentColor: string | null;
  isActive: boolean;
  sortOrder: number;
  clickCount: number;
  createdAt: string;
};

type AdForm = {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  linkText: string;
  position: string;
  type: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  isActive: boolean;
  sortOrder: number;
};

const POSITIONS = [
  { value: 'top_banner', label: 'Top Banner (Above Hero)', desc: 'Compact sponsored slot above the hero section - 1 to 3 ads recommended' },
  { value: 'after_featured', label: 'After Featured Collection', desc: 'Below the Featured carousel, above city sections' },
  { value: 'between_cities_1', label: 'Between Cities (1st)', desc: 'Between Maputo and Beira sections' },
  { value: 'between_cities_2', label: 'Between Cities (2nd)', desc: 'Between Nampula and Tete sections' },
  { value: 'sidebar_strip', label: 'Below Inhambane Grid', desc: 'Full-width strip before the Rent/Buy/Short Stay lists' },
  { value: 'before_footer', label: 'Before Footer CTA', desc: 'Just above the "Become an Agent" section' },
];

const AD_TYPES = [
  { value: 'banner', label: 'Banner', desc: 'Coloured full-width banner with CTA button' },
  { value: 'card_row', label: 'Card', desc: 'Compact bordered card, blends with content' },
  { value: 'strip', label: 'Strip', desc: 'Thin horizontal strip with accent button' },
];

const empty: AdForm = {
  title: '',
  description: '',
  imageUrl: '',
  linkUrl: '',
  linkText: '',
  position: 'top_banner',
  type: 'banner',
  bgColor: '#1a3c5e',
  textColor: '#ffffff',
  accentColor: '#f4a61d',
  isActive: true,
  sortOrder: 0,
};

function positionLabel(pos: string) {
  return POSITIONS.find((p) => p.value === pos)?.label ?? pos;
}

function typeLabel(t: string) {
  return AD_TYPES.find((x) => x.value === t)?.label ?? t;
}

function PreviewAd({ form }: { form: AdForm }) {
  if (!form.title) return (
    <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-[#e0e0e0] text-[#aaa] text-sm">
      Fill in the form to preview
    </div>
  );

  if (form.type === 'banner') {
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: form.bgColor }}>
        <div className="flex items-center justify-between gap-4 px-6 py-5 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1" style={{ color: form.textColor }}>Sponsored</p>
            <p className="text-lg font-extrabold" style={{ color: form.textColor }}>{form.title}</p>
            {form.description && <p className="text-xs opacity-70 mt-0.5" style={{ color: form.textColor }}>{form.description}</p>}
          </div>
          {form.linkUrl && (
            <span className="px-5 py-2.5 rounded-lg font-bold text-sm" style={{ background: form.accentColor, color: '#1a1a1a' }}>
              {form.linkText || 'Learn More →'}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (form.type === 'card_row') {
    return (
      <div className="border border-[#e8e8e8] rounded-xl p-4 bg-white flex items-center gap-4">
        <div className="flex-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#ccc] mb-0.5">Sponsored</p>
          <p className="text-sm font-bold text-[#111]">{form.title}</p>
          {form.description && <p className="text-xs text-[#888]">{form.description}</p>}
        </div>
        {form.linkUrl && (
          <span className="text-xs font-semibold" style={{ color: form.accentColor }}>
            {form.linkText || 'Learn more →'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="border border-[#e6e6e6] rounded-xl px-5 py-3 bg-white flex items-center justify-between gap-4">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#ccc] mb-0.5">Sponsored</p>
        <p className="text-sm font-bold text-[#111]">{form.title}</p>
        {form.description && <p className="text-xs text-[#888]">{form.description}</p>}
      </div>
      {form.linkUrl && (
        <span className="text-white text-xs font-semibold px-4 py-1.5 rounded-lg" style={{ background: form.accentColor }}>
          {form.linkText || 'Learn more →'}
        </span>
      )}
    </div>
  );
}

export default function AdminAdsClient({ ads: initial }: { ads: Ad[] }) {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>(initial);
  const [form, setForm] = useState<AdForm>(empty);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  function openNew() {
    setForm(empty);
    setEditing(false);
    setError('');
    setShowForm(true);
  }

  function openEdit(ad: Ad) {
    setForm({
      id: ad.id,
      title: ad.title,
      description: ad.description ?? '',
      imageUrl: ad.imageUrl ?? '',
      linkUrl: ad.linkUrl ?? '',
      linkText: ad.linkText ?? '',
      position: ad.position,
      type: ad.type,
      bgColor: ad.bgColor ?? '#1a3c5e',
      textColor: ad.textColor ?? '#ffffff',
      accentColor: ad.accentColor ?? '#f4a61d',
      isActive: ad.isActive,
      sortOrder: ad.sortOrder,
    });
    setEditing(true);
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setShowForm(false);
    setForm(empty);
    setEditing(false);
    setError('');
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const url = editing && form.id ? `/api/admin/ads/${form.id}` : '/api/admin/ads';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          description: form.description || null,
          imageUrl: form.imageUrl || null,
          linkUrl: form.linkUrl || null,
          linkText: form.linkText || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.refresh();
      const saved = await res.json();
      if (editing) {
        setAds((prev) => prev.map((a) => (a.id === saved.id ? { ...saved } : a)));
      } else {
        setAds((prev) => [...prev, saved]);
      }
      closeForm();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this ad? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/ads/${id}`, { method: 'DELETE' });
      setAds((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function toggleActive(ad: Ad) {
    const res = await fetch(`/api/admin/ads/${ad.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ad, isActive: !ad.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAds((prev) => prev.map((a) => (a.id === ad.id ? updated : a)));
    }
  }

  const grouped = POSITIONS.reduce<Record<string, Ad[]>>((acc, p) => {
    acc[p.value] = ads.filter((a) => a.position === p.value);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#191c1e]">Advertisements</h1>
            <p className="text-sm text-[#6b7280] mt-1">Manage ads displayed on the home page</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-[#002045] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#003070] transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            New Ad
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Ads', value: ads.length, icon: 'campaign' },
            { label: 'Active', value: ads.filter((a) => a.isActive).length, icon: 'check_circle', color: 'text-emerald-600' },
            { label: 'Inactive', value: ads.filter((a) => !a.isActive).length, icon: 'pause_circle', color: 'text-amber-500' },
            { label: 'Total Clicks', value: ads.reduce((s, a) => s + a.clickCount, 0), icon: 'ads_click', color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl px-5 py-4 border border-[#f0f0f0]">
              <div className="flex items-center gap-2 mb-1">
                <span className={`material-symbols-outlined text-lg ${s.color ?? 'text-[#002045]'}`}>{s.icon}</span>
                <span className="text-xs text-[#6b7280] font-medium">{s.label}</span>
              </div>
              <p className="text-2xl font-extrabold text-[#191c1e]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Form panel */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
              <h2 className="font-bold text-[#191c1e]">{editing ? 'Edit Ad' : 'Create New Ad'}</h2>
              <button onClick={closeForm} className="text-[#6b7280] hover:text-[#191c1e]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: form fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Title *</label>
                  <input
                    className="w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Finance Your Dream Home"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Description</label>
                  <input
                    className="w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Low interest rates from 7.5% — apply in minutes"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1">Link URL</label>
                    <input
                      className="w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
                      value={form.linkUrl}
                      onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1">Button Text</label>
                    <input
                      className="w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
                      value={form.linkText}
                      onChange={(e) => setForm((f) => ({ ...f, linkText: e.target.value }))}
                      placeholder="Get Pre-approved →"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Image URL <span className="font-normal text-[#aaa]">(optional)</span></label>
                  <input
                    className="w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
                    value={form.imageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1">Position</label>
                    <select
                      className="w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20 bg-white"
                      value={form.position}
                      onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                    >
                      {POSITIONS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#aaa] mt-1">{POSITIONS.find((p) => p.value === form.position)?.desc}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1">Ad Type</label>
                    <select
                      className="w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20 bg-white"
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    >
                      {AD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Colors (only relevant for banner) */}
                {form.type === 'banner' && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'bgColor', label: 'Background' },
                      { key: 'textColor', label: 'Text' },
                      { key: 'accentColor', label: 'Button' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-[#374151] mb-1">{label}</label>
                        <div className="flex items-center gap-2 border border-[#e0e0e0] rounded-xl px-3 py-2">
                          <input
                            type="color"
                            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                            value={(form as any)[key]}
                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          />
                          <span className="text-xs text-[#6b7280] font-mono">{(form as any)[key]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {form.type !== 'banner' && (
                  <div className="w-48">
                    <label className="block text-xs font-semibold text-[#374151] mb-1">Accent Colour</label>
                    <div className="flex items-center gap-2 border border-[#e0e0e0] rounded-xl px-3 py-2">
                      <input
                        type="color"
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                        value={form.accentColor}
                        onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                      />
                      <span className="text-xs text-[#6b7280] font-mono">{form.accentColor}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                      className={`w-10 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-emerald-500' : 'bg-[#d1d5db]'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-sm font-medium text-[#374151]">{form.isActive ? 'Active' : 'Inactive'}</span>
                  </label>

                  <div>
                    <label className="text-xs font-semibold text-[#374151] mr-2">Sort Order</label>
                    <input
                      type="number"
                      className="w-16 border border-[#e0e0e0] rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                      value={form.sortOrder}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-[#002045] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#003070] transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : editing ? 'Update Ad' : 'Create Ad'}
                  </button>
                  <button
                    onClick={closeForm}
                    className="px-5 py-2.5 border border-[#e0e0e0] rounded-xl text-sm font-medium text-[#6b7280] hover:bg-[#f9f9f9]"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Right: live preview */}
              <div>
                <p className="text-xs font-semibold text-[#374151] mb-3 uppercase tracking-wider">Live Preview</p>
                <PreviewAd form={form} />
                <div className="mt-4 p-3 bg-[#f8f9fb] rounded-xl">
                  <p className="text-xs text-[#6b7280]">
                    <span className="font-semibold">Position: </span>
                    {POSITIONS.find((p) => p.value === form.position)?.label}
                    <br />
                    <span className="font-semibold">Type: </span>
                    {AD_TYPES.find((t) => t.value === form.type)?.label} — {AD_TYPES.find((t) => t.value === form.type)?.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ads grouped by position */}
        {POSITIONS.map((pos) => {
          const group = grouped[pos.value] ?? [];
          return (
            <div key={pos.value} className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
                <div>
                  <p className="font-bold text-[#191c1e] text-sm">{pos.label}</p>
                  <p className="text-xs text-[#6b7280]">{pos.desc}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${group.length > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f0f0f0] text-[#9ca3af]'}`}>
                  {group.length} ad{group.length !== 1 ? 's' : ''}
                </span>
              </div>

              {group.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-[#aaa]">
                  No ads for this position.{' '}
                  <button
                    onClick={() => { openNew(); setForm((f) => ({ ...f, position: pos.value })); }}
                    className="text-[#002045] font-semibold hover:underline"
                  >
                    Add one
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#f5f5f5]">
                  {group.map((ad) => (
                    <div key={ad.id} className="px-6 py-4 flex items-center gap-4">
                      {/* Type badge */}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-[#f0f4ff] text-[#3b5bdb] rounded-lg flex-shrink-0">
                        {typeLabel(ad.type)}
                      </span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#191c1e] truncate">{ad.title}</p>
                        {ad.description && <p className="text-xs text-[#6b7280] truncate">{ad.description}</p>}
                        {ad.linkUrl && <p className="text-[10px] text-[#aaa] truncate">{ad.linkUrl}</p>}
                      </div>

                      {/* Clicks */}
                      <div className="text-center flex-shrink-0 hidden md:block">
                        <p className="text-xs font-bold text-[#191c1e]">{ad.clickCount}</p>
                        <p className="text-[10px] text-[#aaa]">clicks</p>
                      </div>

                      {/* Colour swatch (banner only) */}
                      {ad.type === 'banner' && ad.bgColor && (
                        <div
                          className="w-6 h-6 rounded-full border border-white shadow flex-shrink-0 hidden md:block"
                          style={{ background: ad.bgColor }}
                          title={ad.bgColor}
                        />
                      )}

                      {/* Toggle active */}
                      <button
                        onClick={() => toggleActive(ad)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors flex-shrink-0 ${
                          ad.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-[#fef3c7] text-amber-600 hover:bg-[#fde68a]'
                        }`}
                      >
                        {ad.isActive ? 'Active' : 'Inactive'}
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEdit(ad)}
                          className="p-2 text-[#6b7280] hover:text-[#002045] hover:bg-[#f0f4ff] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          disabled={deleting === ad.id}
                          className="p-2 text-[#6b7280] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Position guide */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] p-6">
          <p className="text-sm font-bold text-[#191c1e] mb-4">Ad Position Guide</p>
          <div className="space-y-2">
            {POSITIONS.map((p, i) => (
              <div key={p.value} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#002045] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#374151]">{p.label}</p>
                  <p className="text-xs text-[#6b7280]">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
