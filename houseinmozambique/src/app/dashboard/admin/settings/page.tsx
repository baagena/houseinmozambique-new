'use client';

import { useState } from 'react';

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    adminName: 'Dev Admin',
    email: 'admin@houseinmozambique.com',
    platformTagline: 'The Modern Estate Curator',
    globalNotifications: true,
    agentApprovalAlerts: true,
    weeklyReport: false,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Settings updated successfully!');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
       <div>
        <h1 className="text-3xl font-black text-[#002045] tracking-tighter mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
          Platform Settings
        </h1>
        <p className="text-[#74777f] font-medium font-serif leading-relaxed italic">
          Configure administrative controls and global notification preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-12">
        {/* Profile Card */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-[#f2f4f6] shadow-sm space-y-8">
           <h3 className="text-xs font-black text-[#74777f] uppercase tracking-widest px-1">Administrative Profile</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Admin Identity</label>
                <input 
                  type="text" 
                  value={formData.adminName}
                  onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                  className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Restricted Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all shadow-inner"
                />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-[#002045] uppercase tracking-widest ml-1">Global Site Tagline</label>
              <input 
                type="text" 
                value={formData.platformTagline}
                onChange={(e) => setFormData({...formData, platformTagline: e.target.value})}
                className="w-full bg-[#f7f9fb] border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all shadow-inner"
              />
           </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-[#f2f4f6] shadow-sm space-y-8">
           <h3 className="text-xs font-black text-[#74777f] uppercase tracking-widest px-1">Notification Controls</h3>
           
           <div className="space-y-1 gap-1">
              {[
                { key: 'globalNotifications', label: 'Push Notifications', desc: 'Receive real-time alerts for platform activities.' },
                { key: 'agentApprovalAlerts', label: 'Agent Verification Alerts', desc: 'Get notified immediately when a new agent applies.' },
                { key: 'weeklyReport', label: 'Executive Weekly Digest', desc: 'Automated report of platform growth and revenue stats.' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-4 group border-b border-[#f2f4f6] last:border-0 h-20">
                   <div>
                      <p className="text-sm font-black text-[#002045] mb-1">{item.label}</p>
                      <p className="text-[10px] font-bold text-[#c4c6cf] uppercase tracking-widest">{item.desc}</p>
                   </div>
                   <button
                    type="button"
                    onClick={() => setFormData({...formData, [item.key]: !formData[item.key as keyof typeof formData]})}
                    className={`w-14 h-8 rounded-full transition-all relative outline-none ring-0 ${formData[item.key as keyof typeof formData] ? 'bg-[#fab983]' : 'bg-[#f2f4f6]'}`}
                   >
                     <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${formData[item.key as keyof typeof formData] ? 'left-7' : 'left-1'}`} />
                   </button>
                </div>
              ))}
           </div>
        </div>

        <div className="pt-4 flex justify-end">
           <button 
              type="submit"
              disabled={isSaving}
              className="px-12 bg-[#002045] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#002045]/20 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                  Commit System Changes
                </>
              )}
            </button>
        </div>
      </form>
    </div>
  );
}
