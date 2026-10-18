'use client';

import { useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';

const SPECIALIZATIONS = [
  'Luxury Villas', 'Expat Relocations', 'Polana District', 
  'Waterfront Properties', 'Commercial Real Estate', 'Beach Resorts',
  'Short-Term Rentals', 'Investment Properties', 'Modern Lofts'
];

interface Agent {
  id: string;
  name: string;
  initials: string;
  title: string;
  location: string;
  phone: string | null;
  officeAddress: string | null;
  yearsExperience: number | null;
  bio: string | null;
  specializations: string[];
  avatar: string | null;
  agencyName: string | null;
  agencyPhone: string | null;
  agencyBusinessType: string | null;
  agencyAbout: string | null;
  agencyServices: string[];
  agencyAreasServed: string[];
  agencyWebsite: string | null;
  agencyEmail: string | null;
}

export default function ProfileForm({ agent }: { agent: Agent }) {
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState(agent.avatar);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    name: agent.name ?? '',
    title: agent.title ?? '',
    location: agent.location ?? '',
    phone: agent.phone ?? '',
    officeAddress: agent.officeAddress ?? '',
    yearsExperience: agent.yearsExperience ?? 0,
    bio: agent.bio ?? '',
    specializations: agent.specializations ?? [],
    agencyBusinessType: agent.agencyBusinessType ?? '',
    agencyAbout: agent.agencyAbout ?? '',
    agencyServices: agent.agencyServices ?? [],
    agencyAreasServed: (agent.agencyAreasServed ?? []).join(', '),
    agencyWebsite: agent.agencyWebsite ?? '',
    agencyEmail: agent.agencyEmail ?? '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/agent/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    setError(null);
    setSuccess(false);
    try {
      const form = new FormData();
      form.set('avatar', file);
      const response = await fetch('/api/agent/profile/avatar', { method: 'POST', credentials: 'include', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Photo upload failed.');
      setAvatar(data.avatar);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const toggleSpec = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#002045] tracking-tighter mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
            Agent Profile
          </h1>
          <p className="text-[#74777f] font-medium font-serif leading-relaxed italic">
            Manage your professional identity and expertise showcased to the platform.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl flex items-center gap-3">
          <Icon name="check_circle" size={18} />
          Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3">
          <Icon name="error" size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-[#f2f4f6] shadow-sm">
        {/* Avatar Section */}
        <div className="flex items-center gap-8 pb-8 border-b border-[#f2f4f6]">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2rem] bg-[#002045] flex items-center justify-center text-[#fab983] font-black text-2xl border-4 border-white shadow-xl overflow-hidden">
              {avatar ? (
                <Image src={avatar} alt={agent.name} fill className="object-cover" />
              ) : (
                <span>{agent.initials}</span>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-[#002045] mb-1">Profile Imagery</h4>
            <p className="text-[10px] text-[#74777f] font-bold uppercase tracking-widest">Upload a JPG, PNG, or WebP photo (up to 5 MB).</p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#002045] px-4 py-2 text-xs font-bold text-white hover:bg-[#0a2f5c]">
              <Icon name="upload" size={16} />
              {isUploadingPhoto ? 'Uploading photo…' : avatar ? 'Change profile photo' : 'Upload profile photo'}
              <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={isUploadingPhoto} onChange={(event) => { void uploadPhoto(event.target.files?.[0]); event.currentTarget.value = ''; }} />
            </label>
            {avatar && (
              <a
                href={`/api/agent/avatar-download?url=${encodeURIComponent(avatar)}&name=${encodeURIComponent(`${agent.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-profile.jpg`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#002045] underline"
              >
                <Icon name="download" size={16} />
                Download photo
              </a>
            )}
          </div>
        </div>

        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Professional Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Editorial Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Primary Location</label>
            <input 
              type="text" 
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Public contact phone / WhatsApp</label>
            <input type="tel" autoComplete="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+258 84 123 4567" className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Exact office / contact address</label>
            <textarea rows={2} autoComplete="street-address" value={formData.officeAddress} onChange={(e) => setFormData({...formData, officeAddress: e.target.value})} placeholder="Office or building, street, bairro, city and province" className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all resize-none" />
            <p className="text-[11px] text-[#74777f]">This address is shown to visitors on your agent profile.</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Years of Practice</label>
            <input 
              type="number" 
              min={0}
              value={formData.yearsExperience}
              onChange={(e) => setFormData({...formData, yearsExperience: parseInt(e.target.value) || 0})}
              className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all"
            />
          </div>
        </div>

        {/* Narrative bio */}
        {agent.agencyName && (
          <section className="space-y-5 border-t border-[#f2f4f6] pt-8">
            <div><h2 className="text-lg font-black text-[#002045]">{agent.agencyName} · company profile</h2><p className="mt-1 text-xs text-[#74777f]">These details appear on your corporate agency page.</p></div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#002045]">Business type<input value={formData.agencyBusinessType} onChange={(e) => setFormData({...formData, agencyBusinessType: e.target.value})} className="mt-2 w-full rounded-2xl border-0 bg-[#f7f9fb] px-5 py-4 text-sm font-bold normal-case tracking-normal" /></label>
              <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#002045]">Public agency email<input type="email" value={formData.agencyEmail} onChange={(e) => setFormData({...formData, agencyEmail: e.target.value})} className="mt-2 w-full rounded-2xl border-0 bg-[#f7f9fb] px-5 py-4 text-sm font-bold normal-case tracking-normal" /></label>
              <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#002045] md:col-span-2">Website<input type="url" value={formData.agencyWebsite} onChange={(e) => setFormData({...formData, agencyWebsite: e.target.value})} placeholder="https://" className="mt-2 w-full rounded-2xl border-0 bg-[#f7f9fb] px-5 py-4 text-sm font-bold normal-case tracking-normal" /></label>
              <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#002045] md:col-span-2">About the agency<textarea rows={4} value={formData.agencyAbout} onChange={(e) => setFormData({...formData, agencyAbout: e.target.value})} className="mt-2 w-full rounded-2xl border-0 bg-[#f7f9fb] px-5 py-4 text-sm font-bold normal-case tracking-normal" /></label>
              <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#002045] md:col-span-2">Areas served<input value={formData.agencyAreasServed} onChange={(e) => setFormData({...formData, agencyAreasServed: e.target.value})} placeholder="Maputo, Matola, Beira" className="mt-2 w-full rounded-2xl border-0 bg-[#f7f9fb] px-5 py-4 text-sm font-bold normal-case tracking-normal" /></label>
              <div className="space-y-3 md:col-span-2"><p className="text-[10px] font-black uppercase tracking-widest text-[#002045]">Services offered</p><div className="flex flex-wrap gap-2">{['Property consultancy', 'Investment guidance', 'Property management', 'Market research', 'Valuation', 'Brokerage', 'Commercial real estate'].map((service) => <button type="button" key={service} onClick={() => setFormData((current) => ({...current, agencyServices: current.agencyServices.includes(service) ? current.agencyServices.filter((item) => item !== service) : [...current.agencyServices, service]}))} className={`rounded-full px-3 py-2 text-xs ${formData.agencyServices.includes(service) ? 'bg-[#002045] text-white' : 'bg-[#f1f3f5] text-[#5b616b]'}`}>{service}</button>)}</div></div>
            </div>
          </section>
        )}
        {/* Narrative bio */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Professional Narrative</label>
          <textarea 
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            className="w-full bg-[#f7f9fb] border-none rounded-3xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all resize-none shadow-inner"
          />
        </div>

        {/* Specializations */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Core Specializations</label>
          <div className="flex flex-wrap gap-3">
            {SPECIALIZATIONS.map((spec) => {
              const isActive = formData.specializations.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpec(spec)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-[#002045] text-white shadow-xl shadow-[#002045]/10' : 'bg-[#f7f9fb] text-[#74777f] hover:bg-[#f2f4f6]'}`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#002045] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#002045]/20 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Icon name="save" size={18} className="group-hover:rotate-12 transition-transform" />
                Save Profile Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
