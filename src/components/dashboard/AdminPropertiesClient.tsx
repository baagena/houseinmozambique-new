'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AdminPropertyActions from './AdminPropertyActions';
import Icon from '@/components/ui/Icon';
import { listingQuality } from '@/lib/listing-quality';

/** Status chips, in the reference's order. */
const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'SUSPENDED', label: 'Suspended' },
] as const;

type StatusKey = (typeof STATUS_FILTERS)[number]['key'];

/** Fixed slot per property type, so a type keeps its colour across screens. */
const TYPE_SLOT: Record<string, string> = {
  Villa: 'var(--d-slot-1)',
  Apartment: 'var(--d-slot-2)',
  'Beach House': 'var(--d-slot-3)',
  Studio: 'var(--d-slot-4)',
  Penthouse: 'var(--d-slot-5)',
};
function typeColor(type: string): string {
  return TYPE_SLOT[type] ?? 'var(--d-ink)';
}

const mzn = (n: number) => `MT ${Math.round(n).toLocaleString('en-US')}`;
function fmtPrice(price: number, unit: string): string {
  if (unit === 'monthly') return `${mzn(price)}/mo`;
  if (unit === 'nightly') return `${mzn(price)}/nt`;
  return mzn(price);
}

/** Status is never colour-alone — every pill carries an icon and a word. */
const STATUS_PILL: Record<string, { cls: string; icon: string; label: string }> = {
  PUBLISHED: { cls: 'good', icon: 'check_circle', label: 'Published' },
  PENDING: { cls: 'warn', icon: 'schedule', label: 'Pending' },
  REJECTED: { cls: 'crit', icon: 'close', label: 'Rejected' },
  SUSPENDED: { cls: 'muted', icon: 'error', label: 'Suspended' },
};
function statusPill(status: string) {
  const s = STATUS_PILL[status] ?? { cls: 'muted', icon: 'info', label: status };
  return (
    <span className={`pill ${s.cls}`}>
      <Icon name={s.icon} size={11} />
      {s.label}
    </span>
  );
}

export interface AdminProperty {
  id: string;
  title: string;
  description: string;
  city: string;
  neighborhood: string;
  address: string;
  price: number;
  priceUnit: string;
  type: string;
  listingType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  images: string[];
  tags: string[];
  badge: string;
  isFeatured: boolean;
  status: string;
  hostName: string;
  views: number;
  contactClicks: number;
  viewingClicks: number;
}

export default function AdminPropertiesClient({ initialProperties }: { initialProperties: AdminProperty[] }) {
  const [properties, setProperties] = useState(initialProperties);
  const [statusFilter, setStatusFilter] = useState<StatusKey>('ALL');
  const [editing, setEditing] = useState<AdminProperty | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Counts come from the real list, so a chip reading "Pending · 0" is true.
  const counts = STATUS_FILTERS.reduce<Record<string, number>>((acc, f) => {
    acc[f.key] = f.key === 'ALL' ? properties.length : properties.filter((p) => p.status === f.key).length;
    return acc;
  }, {});
  const visible = statusFilter === 'ALL' ? properties : properties.filter((p) => p.status === statusFilter);

  function open(property: AdminProperty) {
    setEditing({ ...property, amenities: [...property.amenities], images: [...property.images], tags: [...property.tags] });
    setError(null);
  }

  function set<K extends keyof AdminProperty>(key: K, value: AdminProperty[K]) {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!editing) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/property/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editing.title,
          description: editing.description,
          city: editing.city,
          neighborhood: editing.neighborhood,
          address: editing.address,
          price: editing.price,
          priceUnit: editing.priceUnit,
          type: editing.type,
          listingType: editing.listingType,
          bedrooms: editing.bedrooms,
          bathrooms: editing.bathrooms,
          area: editing.area,
          amenities: editing.amenities,
          images: editing.images,
          tags: editing.tags,
          badge: editing.badge,
          isFeatured: editing.isFeatured,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed.');
      setProperties((prev) => prev.map((p) => (p.id === editing.id ? { ...editing } : p)));
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>All properties</h1>
          <p>Every listing across every agent and market, regardless of status.</p>
        </div>
        <Link
          href="/post-property?as=admin"
          className="chip on"
          style={{ textDecoration: 'none' }}
        >
          + New listing
        </Link>
      </div>

      <div className="card">
        <div className="toolbar">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`chip${statusFilter === f.key ? ' on' : ''}`}
            >
              {f.label} · {counts[f.key]}
            </button>
          ))}
          <span className="spacer" />
          <span className="hint">Sorted by newest</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Type</th>
                <th>Host</th>
                <th>Price</th>
                <th>Performance</th>
                <th>Quality</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const q = listingQuality(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-primary">
                        <div className="thumb" style={{ background: typeColor(p.type), overflow: 'hidden' }}>
                          {p.images[0] ? (
                            <Image src={p.images[0]} alt="" width={42} height={42} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                          ) : (
                            <Icon name="domain" size={18} />
                          )}
                        </div>
                        <div>
                          <div className="name-strong">
                            {p.title}
                            {p.isFeatured && <span className="tag gold" style={{ marginLeft: 6 }}>Featured</span>}
                            {p.badge && <span className="tag" style={{ marginLeft: 6 }}>{p.badge}</span>}
                          </div>
                          <div className="name-sub">{[p.neighborhood, p.city].filter(Boolean).join(', ')}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="tag">{p.listingType}</span></td>
                    <td>{p.hostName}</td>
                    <td className="tabular" style={{ fontWeight: 600 }}>{fmtPrice(p.price, p.priceUnit)}</td>
                    <td className="tabular" style={{ color: 'var(--d-text-2)' }}>
                      {p.views.toLocaleString('en-US')} views · {p.contactClicks} contacts
                    </td>
                    <td>
                      <div style={{ minWidth: 96 }} title={q.missing.length ? `Missing: ${q.missing.join(', ')}` : 'Complete'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--d-border-soft)', overflow: 'hidden' }}>
                            <div style={{ width: `${q.score}%`, height: '100%', background: `var(--d-${q.band})` }} />
                          </div>
                          <span className="tabular" style={{ fontSize: 'var(--d-fs-sm)', fontWeight: 700, color: `var(--d-${q.band})` }}>
                            {q.score}
                          </span>
                        </div>
                        {q.missing.length > 0 && (
                          <div style={{ fontSize: 'var(--d-fs-label)', color: 'var(--d-text-3)', marginTop: 3 }}>
                            {q.missing.length} item{q.missing.length > 1 ? 's' : ''} missing
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{statusPill(p.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-actions">
                        <AdminPropertyActions propertyId={p.id} currentStatus={p.status} onEdit={() => open(p)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      <Icon name="domain" size={22} />
                      <p style={{ margin: '8px 0 0', fontWeight: 600, color: 'var(--d-text-1)' }}>
                        {properties.length === 0 ? 'No listings yet' : `Nothing ${STATUS_FILTERS.find((f) => f.key === statusFilter)?.label.toLowerCase()}`}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 'var(--d-fs-sm)', color: 'var(--d-text-3)' }}>
                        {properties.length === 0
                          ? 'Once an agent publishes, listings appear here.'
                          : 'Try another filter above.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1f3a]/30 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#eceef1] bg-white p-6 shadow-xl">
            <button onClick={() => setEditing(null)} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md text-[#9aa0a8] hover:bg-[#f5f6f8] hover:text-[#002045]">
              <Icon name="close" />
            </button>
            <h3 className="mb-5 text-base font-semibold text-[#002045]">Edit listing</h3>

            {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Title</label>
                <input value={editing.title} onChange={(e) => set('title', e.target.value)} className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <NumField label="Price" value={editing.price} onChange={(v) => set('price', v)} />
                <NumField label="Area (m²)" value={editing.area} onChange={(v) => set('area', v)} />
                <NumField label="Bedrooms" value={editing.bedrooms} onChange={(v) => set('bedrooms', v)} />
                <NumField label="Bathrooms" value={editing.bathrooms} onChange={(v) => set('bathrooms', v)} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SelectField label="Listing type" value={editing.listingType} onChange={(v) => set('listingType', v)} options={['Buy', 'Rent', 'Short Stay', 'Auction']} />
                <TextField label="Property type" value={editing.type} onChange={(v) => set('type', v)} />
                <SelectField label="Price unit" value={editing.priceUnit} onChange={(v) => set('priceUnit', v)} options={['sale', 'monthly', 'nightly']} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TextField label="City" value={editing.city} onChange={(v) => set('city', v)} />
                <TextField label="Neighborhood" value={editing.neighborhood} onChange={(v) => set('neighborhood', v)} />
                <TextField label="Address" value={editing.address} onChange={(v) => set('address', v)} />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Description</label>
                <textarea rows={5} value={editing.description} onChange={(e) => set('description', e.target.value)} className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] leading-relaxed text-[#43474e] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10" />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Amenities (comma separated)</label>
                <textarea rows={2} value={editing.amenities.join(', ')} onChange={(e) => set('amenities', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] text-[#43474e] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10" />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Image URLs (comma separated)</label>
                <textarea rows={2} value={editing.images.join(', ')} onChange={(e) => set('images', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] text-[#43474e] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField label="Badge" value={editing.badge} onChange={(v) => set('badge', v)} />
                <TextField label="Tags (comma separated)" value={editing.tags.join(', ')} onChange={(v) => set('tags', v.split(',').map((s) => s.trim()).filter(Boolean))} />
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e3e6ea] bg-[#fafbfc] px-3 py-2.5 text-[13px] font-medium text-[#002045]">
                <input type="checkbox" checked={editing.isFeatured} onChange={(event) => set('isFeatured', event.target.checked)} className="h-4 w-4 accent-[#002045]" />
                Feature this property on the homepage
              </label>

              <a
                href={`/api/admin/property/${editing.id}/images`}
                className="inline-flex items-center gap-2 text-[13px] font-medium text-[#002045] hover:underline"
              >
                <Icon name="download" size={18} />
                Download all property images
              </a>
            </div>

            <div className="mt-7 flex justify-end gap-2.5">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-[#e3e6ea] px-4 py-2 text-[13px] font-medium text-[#5b616b] hover:bg-[#f5f6f8]">Cancel</button>
              <button onClick={save} disabled={isSaving} className="rounded-lg bg-[#002045] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0a2f5c] disabled:opacity-50">
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10" />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] tabular-nums outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
