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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#002045] tracking-tight">Platform settings</h1>
        <p className="mt-1 text-sm text-[#74777f]">
          Configure administrative controls and global notification preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-[#eceef1] overflow-hidden">
          <div className="px-5 h-12 flex items-center border-b border-[#eceef1]">
            <h3 className="text-sm font-semibold text-[#002045]">Administrative profile</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Admin identity</label>
                <input
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Restricted email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Global site tagline</label>
              <input
                type="text"
                value={formData.platformTagline}
                onChange={(e) => setFormData({ ...formData, platformTagline: e.target.value })}
                className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
              />
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white rounded-xl border border-[#eceef1] overflow-hidden">
          <div className="px-5 h-12 flex items-center border-b border-[#eceef1]">
            <h3 className="text-sm font-semibold text-[#002045]">Notification controls</h3>
          </div>
          <div className="px-5">
            {[
              { key: 'globalNotifications', label: 'Push notifications', desc: 'Receive real-time alerts for platform activities.' },
              { key: 'agentApprovalAlerts', label: 'Agent verification alerts', desc: 'Get notified immediately when a new agent applies.' },
              { key: 'weeklyReport', label: 'Executive weekly digest', desc: 'Automated report of platform growth and revenue stats.' },
            ].map((item) => {
              const on = formData[item.key as keyof typeof formData] as boolean;
              return (
                <div key={item.key} className="flex items-center justify-between gap-4 py-4 border-b border-[#f2f4f6] last:border-0">
                  <div className="leading-snug">
                    <p className="text-[13px] font-medium text-[#002045]">{item.label}</p>
                    <p className="text-[12px] text-[#9aa0a8]">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, [item.key]: !on })}
                    className={`relative h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${on ? 'bg-[#002045]' : 'bg-[#d7dbe0]'}`}
                  >
                    <span className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#002045] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a2f5c] disabled:opacity-50"
          >
            {isSaving ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">check</span>
                Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
