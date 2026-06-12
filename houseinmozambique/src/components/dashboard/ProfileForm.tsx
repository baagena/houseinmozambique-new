'use client';

import { useState } from 'react';
import Image from 'next/image';

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
  yearsExperience: number | null;
  bio: string | null;
  specializations: string[];
  avatar: string | null;
}

export default function ProfileForm({ agent }: { agent: Agent }) {
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: agent.name ?? '',
    title: agent.title ?? '',
    location: agent.location ?? '',
    yearsExperience: agent.yearsExperience ?? 0,
    bio: agent.bio ?? '',
    specializations: agent.specializations ?? [],
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
          <span className="material-symbols-outlined text-lg">check_circle</span>
          Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-[#f2f4f6] shadow-sm">
        {/* Avatar Section */}
        <div className="flex items-center gap-8 pb-8 border-b border-[#f2f4f6]">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2rem] bg-[#002045] flex items-center justify-center text-[#fab983] font-black text-2xl border-4 border-white shadow-xl overflow-hidden">
              {agent.avatar ? (
                <Image src={agent.avatar} alt={agent.name} fill className="object-cover" />
              ) : (
                <span>{agent.initials}</span>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-[#002045] mb-1">Profile Imagery</h4>
            <p className="text-[10px] text-[#74777f] font-bold uppercase tracking-widest">Recommended: 800x800px High-Res Portrait</p>
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
                <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">save</span>
                Save Profile Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
