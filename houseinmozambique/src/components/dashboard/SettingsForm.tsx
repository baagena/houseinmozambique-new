'use client';

import { useState } from 'react';

interface SettingsFormProps {
  email: string;
  phone: string;
}

export default function SettingsForm({ email, phone: initialPhone }: SettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState(initialPhone);
  const [language, setLanguage] = useState('English');
  const [prefs, setPrefs] = useState({
    leadNotifications: true,
    systemAlerts: false,
    marketingEmails: false,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/agent/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
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

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[#002045] tracking-tighter mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
          Account Settings
        </h1>
        <p className="text-[#74777f] font-medium font-serif leading-relaxed italic">
          Manage your account security, contact preferences, and professional notifications.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl flex items-center gap-3">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          Settings saved successfully!
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-10">
        {/* Contact info card */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-[#f2f4f6] shadow-sm space-y-8">
           <h3 className="text-xs font-black text-[#74777f] uppercase tracking-widest px-1">Contact &amp; Region</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Professional Email</label>
                <input 
                  type="email" 
                  value={email}
                  disabled
                  className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#c4c6cf] cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Direct Mobile</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+258 84 000 0000"
                  className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all shadow-inner"
                />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Preferred Language</label>
              <div className="relative">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all shadow-inner appearance-none cursor-pointer"
                >
                  <option>English</option>
                  <option>Portuguese</option>
                  <option>French</option>
                </select>
                <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-[#c4c6cf] pointer-events-none">expand_more</span>
              </div>
           </div>
        </div>

        {/* Notifications card */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-[#f2f4f6] shadow-sm space-y-8">
           <h3 className="text-xs font-black text-[#74777f] uppercase tracking-widest px-1">Alert Preferences</h3>
           
           <div className="space-y-2">
              {[
                { key: 'leadNotifications' as const, label: 'Lead & Inquiry Alerts', desc: 'Instant notifications when a new lead message arrives.' },
                { key: 'systemAlerts' as const, label: 'Security & System Alerts', desc: 'Critical updates regarding your account security.' },
                { key: 'marketingEmails' as const, label: 'Agent Insights & Tips', desc: 'Weekly digest on premium market trends in Mozambique.' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-5 border-b border-[#f2f4f6] last:border-0 h-24">
                   <div>
                      <p className="text-sm font-black text-[#002045] mb-1">{item.label}</p>
                      <p className="text-[10px] font-bold text-[#c4c6cf] uppercase tracking-widest max-w-[280px] sm:max-w-none">{item.desc}</p>
                   </div>
                   <button
                    type="button"
                    onClick={() => setPrefs({...prefs, [item.key]: !prefs[item.key]})}
                    className={`w-14 h-8 rounded-full transition-all relative outline-none ring-0 focus:ring-4 focus:ring-[#fab983]/20 ${prefs[item.key] ? 'bg-[#fab983]' : 'bg-[#f2f4f6]'}`}
                   >
                     <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${prefs[item.key] ? 'left-7' : 'left-1'}`} />
                   </button>
                </div>
              ))}
           </div>
        </div>

        <div className="pt-6 flex justify-end">
           <button 
              type="submit"
              disabled={isSaving}
              className="px-12 bg-[#002045] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#002045]/20 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">verified_user</span>
                  Update Preferences
                </>
              )}
            </button>
        </div>
      </form>
    </div>
  );
}
