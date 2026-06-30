'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface AdminAgent {
  id: string;
  name: string;
  initials: string;
  title: string;
  location: string;
  phone: string;
  bio: string;
  avatar: string;
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  specializations: string[];
  email: string;
  role: string;
  propertyCount: number;
}

type Draft = Partial<AdminAgent> & { password?: string };

const EMPTY_DRAFT: Draft = {
  name: '', email: '', password: '', title: 'Agent', location: 'Mozambique', phone: '',
  bio: '', avatar: '', yearsExperience: 0, specializations: [], isFeatured: false,
  isVerified: true, role: 'AGENT',
};

export default function AdminAgentsClient({ initialAgents }: { initialAgents: AdminAgent[] }) {
  const router = useRouter();
  const [agents, setAgents] = useState(initialAgents);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function openCreate() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setMode('create');
    setError(null);
  }

  function openEdit(agent: AdminAgent) {
    setDraft({ ...agent, password: '' });
    setEditingId(agent.id);
    setMode('edit');
    setError(null);
  }

  function close() {
    setMode(null);
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setError(null);
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setIsSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: draft.name,
        title: draft.title,
        location: draft.location,
        phone: draft.phone,
        bio: draft.bio,
        avatar: draft.avatar,
        yearsExperience: draft.yearsExperience,
        rating: draft.rating,
        reviewCount: draft.reviewCount,
        specializations: draft.specializations,
        isFeatured: draft.isFeatured,
        isVerified: draft.isVerified,
        role: draft.role,
      };
      if (draft.password) payload.password = draft.password;

      let res: Response;
      if (mode === 'create') {
        payload.email = draft.email;
        res = await fetch('/api/admin/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/agent/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed.');

      const saved: AdminAgent = {
        ...EMPTY_DRAFT,
        ...(draft as AdminAgent),
        ...data.agent,
        propertyCount: editingId
          ? agents.find((a) => a.id === editingId)?.propertyCount ?? 0
          : 0,
      };

      setAgents((prev) =>
        mode === 'create' ? [saved, ...prev] : prev.map((a) => (a.id === saved.id ? saved : a))
      );
      close();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this agent's access? Their listings will be hidden.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/agent/${id}/revoke`, { method: 'POST', credentials: 'include' }).then((r) => r.json());
      if (!res.success) throw new Error(res.error || 'Revoke failed.');
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Revoke failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(agent: AdminAgent) {
    if (!confirm(`Permanently delete ${agent.name}? This cannot be undone.`)) return;
    setBusyId(agent.id);
    try {
      const res = await fetch(`/api/admin/agent/${agent.id}`, { method: 'DELETE', credentials: 'include' }).then((r) => r.json());
      if (!res.success) throw new Error(res.error || 'Delete failed.');
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#002045]">Manage agents</h2>
          <p className="mt-1 text-sm text-[#74777f]">Create, edit, and manage every agent profile.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[13px] font-medium text-[#9aa0a8] sm:inline">{agents.length} agents</span>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-[#002045] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a2f5c]"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add agent
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#eceef1] bg-white">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#eceef1] bg-[#fafbfc]">
              <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">Agent</th>
              <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">Portfolio</th>
              <th className="px-5 py-2.5 text-[11px] font-medium text-[#9aa0a8]">Role / status</th>
              <th className="px-5 py-2.5 text-right text-[11px] font-medium text-[#9aa0a8]">Controls</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="group border-b border-[#f2f4f6] transition-colors hover:bg-[#fafbfc] last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#eceef1]">
                      {agent.avatar ? (
                        <Image src={agent.avatar} alt={agent.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f6f8] text-[11px] font-semibold text-[#1a365d]">
                          {agent.initials}
                        </div>
                      )}
                    </div>
                    <div className="leading-tight">
                      <p className="text-[13px] font-medium text-[#002045]">{agent.name}</p>
                      <p className="text-[12px] text-[#9aa0a8]">{agent.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[13px] font-medium text-[#002045]">{agent.propertyCount} listed</span>
                  <p className="text-[12px] text-[#9aa0a8]">{agent.location}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${agent.role === 'ADMIN' ? 'bg-[#002045] text-white' : 'bg-[#f1f3f5] text-[#5b616b]'}`}>
                      {agent.role === 'ADMIN' ? 'Admin' : 'Agent'}
                    </span>
                    {agent.isVerified && (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">Verified</span>
                    )}
                    {agent.isFeatured && (
                      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">Featured</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-3 text-[13px] font-medium opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      onClick={() => openEdit(agent)}
                      disabled={busyId === agent.id}
                      className="text-[#002045] hover:underline disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <Link
                      href={`/dashboard/admin/agents/${agent.id}`}
                      className="text-[#74777f] hover:text-[#002045]"
                    >
                      Analytics
                    </Link>
                    <button
                      onClick={() => revoke(agent.id)}
                      disabled={busyId === agent.id}
                      className="text-[#845326] hover:underline disabled:opacity-50"
                    >
                      Revoke
                    </button>
                    <button
                      onClick={() => remove(agent)}
                      disabled={busyId === agent.id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center text-sm text-[#9aa0a8]">
                  No agents yet. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1f3a]/30 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#eceef1] bg-white p-6 shadow-xl">
            <button onClick={close} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md text-[#9aa0a8] hover:bg-[#f5f6f8] hover:text-[#002045]">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h3 className="text-base font-semibold text-[#002045]">{mode === 'create' ? 'Add new agent' : `Edit ${draft.name}`}</h3>
            <p className="mb-5 mt-0.5 text-sm text-[#74777f]">
              {mode === 'create' ? 'Provision a new agent account with login credentials.' : 'Update this agent’s profile details.'}
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={draft.name ?? ''} onChange={(v) => set('name', v)} />
              <Field label="Email" type="email" value={draft.email ?? ''} onChange={(v) => set('email', v)} disabled={mode === 'edit'} />
              <Field label={mode === 'create' ? 'Password' : 'Reset Password (optional)'} type="password" value={draft.password ?? ''} onChange={(v) => set('password', v)} />
              <Field label="Title" value={draft.title ?? ''} onChange={(v) => set('title', v)} />
              <Field label="Location" value={draft.location ?? ''} onChange={(v) => set('location', v)} />
              <Field label="Phone" value={draft.phone ?? ''} onChange={(v) => set('phone', v)} />
              <Field label="Years Experience" type="number" value={String(draft.yearsExperience ?? 0)} onChange={(v) => set('yearsExperience', Number(v))} />
              <Field label="Avatar URL" value={draft.avatar ?? ''} onChange={(v) => set('avatar', v)} />
              {mode === 'edit' && (
                <>
                  <Field label="Rating (0–5)" type="number" value={String(draft.rating ?? 0)} onChange={(v) => set('rating', Number(v))} />
                  <Field label="Review Count" type="number" value={String(draft.reviewCount ?? 0)} onChange={(v) => set('reviewCount', Number(v))} />
                </>
              )}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Specializations (comma separated)</label>
              <input
                value={(draft.specializations ?? []).join(', ')}
                onChange={(e) => set('specializations', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
              />
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Bio</label>
              <textarea
                rows={3}
                value={draft.bio ?? ''}
                onChange={(e) => set('bio', e.target.value)}
                className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-5">
              <Toggle label="Verified" checked={!!draft.isVerified} onChange={(v) => set('isVerified', v)} />
              <Toggle label="Featured" checked={!!draft.isFeatured} onChange={(v) => set('isFeatured', v)} />
              <div className="flex items-center gap-2">
                <label className="text-[12px] font-medium text-[#5b616b]">Role</label>
                <select
                  value={draft.role ?? 'AGENT'}
                  onChange={(e) => set('role', e.target.value)}
                  className="rounded-lg border border-[#e3e6ea] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#002045] outline-none"
                >
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-2.5">
              <button onClick={close} className="rounded-lg border border-[#e3e6ea] px-4 py-2 text-[13px] font-medium text-[#5b616b] hover:bg-[#f5f6f8]">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={isSaving}
                className="rounded-lg bg-[#002045] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0a2f5c] disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : mode === 'create' ? 'Create agent' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', disabled = false,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10 disabled:bg-[#f5f6f8] disabled:opacity-70"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2"
    >
      <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${checked ? 'bg-[#002045]' : 'bg-[#d7dbe0]'}`}>
        <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </span>
      <span className="text-[13px] font-medium text-[#5b616b]">{label}</span>
    </button>
  );
}
