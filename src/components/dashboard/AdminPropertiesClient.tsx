'use client';

import { useState } from 'react';
import Image from 'next/image';
import AdminPropertyActions from './AdminPropertyActions';

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
  status: string;
  hostName: string;
}

export default function AdminPropertiesClient({ initialProperties }: { initialProperties: AdminProperty[] }) {
  const [properties, setProperties] = useState(initialProperties);
  const [editing, setEditing] = useState<AdminProperty | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#002045]">Property inventory</h2>
          <p className="mt-1 text-sm text-[#74777f]">Edit, publish, or remove any listing on the platform.</p>
        </div>
        <span className="text-[13px] font-medium text-[#9aa0a8]">{properties.length} listings</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#eceef1] bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#eceef1] bg-[#fafbfc]">
              <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">Property</th>
              <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">Host / agent</th>
              <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">Status</th>
              <th className="px-5 py-2.5 text-right text-[11px] font-medium text-[#9aa0a8]">Controls</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="group border-b border-[#f2f4f6] transition-colors hover:bg-[#fafbfc] last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={p.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=200'}
                        alt={p.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[13px] font-medium text-[#002045]">{p.title}</p>
                      <p className="text-[12px] text-[#9aa0a8]">{p.city}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-[13px] text-[#5b616b]">{p.hostName}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${p.status === 'PUBLISHED' ? 'bg-emerald-500' : p.status === 'REJECTED' ? 'bg-red-500' : 'bg-[#e0a458]'}`} />
                    <span className={`text-[13px] font-medium capitalize ${p.status === 'PUBLISHED' ? 'text-emerald-600' : p.status === 'REJECTED' ? 'text-red-600' : 'text-[#845326]'}`}>
                      {p.status.toLowerCase()}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-3 text-[13px] font-medium">
                    <button
                      onClick={() => open(p)}
                      className="text-[#002045] hover:underline"
                    >
                      Edit
                    </button>
                    <AdminPropertyActions propertyId={p.id} currentStatus={p.status} />
                  </div>
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center text-sm text-[#9aa0a8]">
                  No properties yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1f3a]/30 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#eceef1] bg-white p-6 shadow-xl">
            <button onClick={() => setEditing(null)} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md text-[#9aa0a8] hover:bg-[#f5f6f8] hover:text-[#002045]">
              <span className="material-symbols-outlined text-[20px]">close</span>
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
