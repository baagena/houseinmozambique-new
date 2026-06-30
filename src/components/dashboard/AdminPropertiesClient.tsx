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
        <h2 className="text-2xl font-black text-[#002045]">Global Property Inventory</h2>
        <span className="rounded-full bg-[#845326]/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#845326]">
          {properties.length} Assets
        </span>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-[#f2f4f6] bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#74777f]">Property Asset</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#74777f]">Host / Agent</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#74777f]">Status</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[#74777f]">Admin Control</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-b border-[#f2f4f6] transition-colors hover:bg-[#f7f9fb]">
                <td className="flex items-center gap-4 px-6 py-4">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={p.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=200'}
                      alt={p.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#002045]">{p.title}</p>
                    <p className="text-[10px] font-bold uppercase tracking-tight text-[#74777f]">{p.city}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-[#002045]">{p.hostName}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${p.status === 'PUBLISHED' ? 'bg-emerald-500' : p.status === 'REJECTED' ? 'bg-red-500' : 'bg-[#fab983]'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${p.status === 'PUBLISHED' ? 'text-emerald-600' : p.status === 'REJECTED' ? 'text-red-600' : 'text-[#845326]'}`}>
                      {p.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => open(p)}
                      className="text-[10px] font-black uppercase tracking-widest text-[#002045] hover:underline"
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
                <td colSpan={4} className="px-6 py-16 text-center text-[10px] font-black uppercase tracking-widest text-[#c4c6cf]">
                  No properties yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-8 shadow-2xl">
            <button onClick={() => setEditing(null)} className="absolute right-5 top-5 text-xl font-black text-[#74777f] hover:text-[#002045]">×</button>
            <h3 className="mb-6 text-xl font-black text-[#002045]">Edit Listing</h3>

            {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-[#74777f]">Title</label>
                <input value={editing.title} onChange={(e) => set('title', e.target.value)} className="w-full rounded-xl border border-[#f2f4f6] bg-[#fafbfc] px-4 py-3 text-sm font-bold text-[#002045] outline-none focus:ring-2 focus:ring-[#002045]/10" />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <NumField label="Price" value={editing.price} onChange={(v) => set('price', v)} />
                <NumField label="Area (m²)" value={editing.area} onChange={(v) => set('area', v)} />
                <NumField label="Bedrooms" value={editing.bedrooms} onChange={(v) => set('bedrooms', v)} />
                <NumField label="Bathrooms" value={editing.bathrooms} onChange={(v) => set('bathrooms', v)} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SelectField label="Listing Type" value={editing.listingType} onChange={(v) => set('listingType', v)} options={['Buy', 'Rent', 'Short Stay', 'Auction']} />
                <TextField label="Property Type" value={editing.type} onChange={(v) => set('type', v)} />
                <SelectField label="Price Unit" value={editing.priceUnit} onChange={(v) => set('priceUnit', v)} options={['sale', 'monthly', 'nightly']} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <TextField label="City" value={editing.city} onChange={(v) => set('city', v)} />
                <TextField label="Neighborhood" value={editing.neighborhood} onChange={(v) => set('neighborhood', v)} />
                <TextField label="Address" value={editing.address} onChange={(v) => set('address', v)} />
              </div>

              <div>
                <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-[#74777f]">Description</label>
                <textarea rows={6} value={editing.description} onChange={(e) => set('description', e.target.value)} className="w-full rounded-xl border border-[#f2f4f6] bg-[#fafbfc] px-4 py-3 text-sm leading-relaxed text-[#43474e] outline-none focus:ring-2 focus:ring-[#002045]/10" />
              </div>

              <div>
                <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-[#74777f]">Amenities (comma separated)</label>
                <textarea rows={2} value={editing.amenities.join(', ')} onChange={(e) => set('amenities', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} className="w-full rounded-xl border border-[#f2f4f6] bg-[#fafbfc] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002045]/10" />
              </div>

              <div>
                <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-[#74777f]">Image URLs (comma separated)</label>
                <textarea rows={2} value={editing.images.join(', ')} onChange={(e) => set('images', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} className="w-full rounded-xl border border-[#f2f4f6] bg-[#fafbfc] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#002045]/10" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField label="Badge" value={editing.badge} onChange={(v) => set('badge', v)} />
                <TextField label="Tags (comma separated)" value={editing.tags.join(', ')} onChange={(v) => set('tags', v.split(',').map((s) => s.trim()).filter(Boolean))} />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-[#f2f4f6] px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#74777f] hover:bg-[#f7f9fb]">Cancel</button>
              <button onClick={save} disabled={isSaving} className="rounded-xl bg-[#845326] px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#6f441f] disabled:opacity-50">
                {isSaving ? 'Saving…' : 'Save Changes'}
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
      <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-[#74777f]">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-[#f2f4f6] bg-[#fafbfc] px-4 py-3 text-sm font-medium text-[#002045] outline-none focus:ring-2 focus:ring-[#002045]/10" />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-[#74777f]">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-xl border border-[#f2f4f6] bg-[#fafbfc] px-4 py-3 text-sm font-black text-[#002045] outline-none focus:ring-2 focus:ring-[#002045]/10" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-[#74777f]">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-[#f2f4f6] bg-[#fafbfc] px-4 py-3 text-sm font-black text-[#002045] outline-none focus:ring-2 focus:ring-[#002045]/10">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
