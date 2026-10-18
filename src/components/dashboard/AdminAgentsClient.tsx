'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardActionMenu from '@/components/dashboard/DashboardActionMenu';
import Icon from '@/components/ui/Icon';

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
  /** Kept out of the public /agents directory: demo, test, internal. */
  isHidden: boolean;
  /** When the agent confirmed their email (ISO), or null. Unverified agents cannot sign in. */
  emailVerifiedAt: string | null;
  specializations: string[];
  email: string;
  role: string;
  propertyCount: number;
  agencyName?: string;
  agencyPhone?: string;
  agencyBusinessType?: string;
  agencyAbout?: string;
  agencyServices?: string[];
  agencyAreasServed?: string[];
  agencyWebsite?: string;
  agencyEmail?: string;
  officeAddress?: string;
  corporateStatus?: string;
  corporatePaidThrough?: string | null;
}

type AgentAccountType = 'INDIVIDUAL' | 'CORPORATE';
type Draft = Partial<AdminAgent> & {
  password?: string;
  emailVerified?: boolean;
  accountType?: AgentAccountType;
  specializationsText?: string;
  agencyServicesText?: string;
  agencyAreasServedText?: string;
};

const splitCommaList = (value: string) => value.split(/[,;\n]/).map((part) => part.trim()).filter(Boolean);

const EMPTY_DRAFT: Draft = {
  name: '', email: '', password: '', accountType: 'INDIVIDUAL', title: 'Real Estate Agent', location: 'Maputo', phone: '',
  bio: '', avatar: '', yearsExperience: 0, specializations: [], isFeatured: false,
  isVerified: true, isHidden: false, role: 'AGENT', officeAddress: '', agencyName: '', agencyPhone: '',
  agencyBusinessType: '', agencyAbout: '', agencyServices: [], agencyAreasServed: [], agencyWebsite: '', agencyEmail: '',
  specializationsText: '', agencyServicesText: '', agencyAreasServedText: '',
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [agentFilter, setAgentFilter] = useState<'ALL' | 'INDIVIDUAL' | 'CORPORATE' | 'ADMIN'>('ALL');

  const isCorporate = (agent: AdminAgent) => Boolean(agent.corporateStatus || agent.agencyName);
  const visibleAgents = agents.filter((agent) => {
    if (agentFilter === 'CORPORATE') return isCorporate(agent);
    if (agentFilter === 'INDIVIDUAL') return agent.role !== 'ADMIN' && !isCorporate(agent);
    if (agentFilter === 'ADMIN') return agent.role === 'ADMIN';
    return true;
  });

  function openCreate() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setMode('create');
    setError(null);
    setUploadingAvatar(false);
  }

  function openEdit(agent: AdminAgent) {
    setDraft({
      ...agent,
      password: '',
      accountType: isCorporate(agent) ? 'CORPORATE' : 'INDIVIDUAL',
      specializationsText: agent.specializations.join(', '),
      agencyServicesText: (agent.agencyServices ?? []).join(', '),
      agencyAreasServedText: (agent.agencyAreasServed ?? []).join(', '),
    });
    setEditingId(agent.id);
    setMode('edit');
    setError(null);
    setUploadingAvatar(false);
  }

  function close() {
    setMode(null);
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setError(null);
    setUploadingAvatar(false);
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadAvatar(file?: File) {
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('avatar', file);
      const response = await fetch('/api/admin/agent/avatar', { method: 'POST', body: form, credentials: 'include' });
      const data = await response.json();
      if (!response.ok || !data.avatar) throw new Error(data.error || 'Photo upload failed.');
      set('avatar', data.avatar);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Photo upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
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
        specializations: splitCommaList(draft.specializationsText ?? (draft.specializations ?? []).join(', ')),
        isFeatured: draft.isFeatured,
        isVerified: draft.isVerified,
        isHidden: draft.isHidden,
        role: draft.role,
        accountType: draft.accountType ?? 'INDIVIDUAL',
        officeAddress: draft.officeAddress,
        agencyName: draft.agencyName,
        agencyPhone: draft.agencyPhone,
        agencyBusinessType: draft.agencyBusinessType,
        agencyAbout: draft.agencyAbout,
        agencyServices: splitCommaList(draft.agencyServicesText ?? (draft.agencyServices ?? []).join(', ')),
        agencyAreasServed: splitCommaList(draft.agencyAreasServedText ?? (draft.agencyAreasServed ?? []).join(', ')),
        agencyWebsite: draft.agencyWebsite,
        agencyEmail: draft.agencyEmail,
      };
      if (mode === 'edit' && draft.emailVerified !== undefined) payload.emailVerified = draft.emailVerified;
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-60">
          <h2 className="text-xl font-semibold tracking-tight text-[#002045]">Manage agents</h2>
          <p className="mt-1 text-sm text-[#74777f]">Create, edit, and manage every agent profile.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[13px] font-medium text-[#9aa0a8] sm:inline">{visibleAgents.length} shown · {agents.length} total</span>
          <button
            onClick={openCreate}
            className="flex flex-none items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#002045] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0a2f5c]"
          >
            <Icon name="person_add" size={18} />
            Add agent
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filter agent accounts">
        {([
          ['ALL', 'All accounts', agents.length],
          ['INDIVIDUAL', 'Individual agents', agents.filter((agent) => agent.role !== 'ADMIN' && !isCorporate(agent)).length],
          ['CORPORATE', 'Corporate agencies', agents.filter(isCorporate).length],
          ['ADMIN', 'Platform admins', agents.filter((agent) => agent.role === 'ADMIN').length],
        ] as const).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            onClick={() => setAgentFilter(value)}
            aria-pressed={agentFilter === value}
            className={`rounded-full border px-3.5 py-2 text-[12px] font-medium transition ${agentFilter === value ? 'border-[#002045] bg-[#002045] text-white' : 'border-[#e3e6ea] bg-white text-[#5b616b] hover:border-[#002045]/30 hover:text-[#002045]'}`}
          >
            {label} <span className={agentFilter === value ? 'text-white/70' : 'text-[#9aa0a8]'}>{count}</span>
          </button>
        ))}
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
            {visibleAgents.map((agent) => (
              <tr key={agent.id} className="group border-b border-[#f2f4f6] transition-colors hover:bg-[#fafbfc] last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#eceef1]">
                      {agent.avatar ? (
                        <a
                          href={`/api/agent/avatar-download?url=${encodeURIComponent(agent.avatar)}&name=${encodeURIComponent(`${agent.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-profile.jpg`)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download agent photo"
                          className="block h-full w-full"
                        >
                          <Image src={agent.avatar} alt={agent.name} fill className="object-cover" />
                        </a>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f6f8] text-[11px] font-semibold text-[#1a365d]">
                          {agent.initials}
                        </div>
                      )}
                    </div>
                    <div className="leading-tight">
                      <p className="text-[13px] font-medium text-[#002045]">{agent.name}</p>
                      <p className="text-[12px] text-[#9aa0a8]">{agent.email}</p>
                      {isCorporate(agent) && <p className="mt-1 text-[12px] font-medium text-[#845326]">{agent.agencyName || 'Corporate agency'} · {agent.agencyBusinessType || 'Real estate'} · {(agent.corporateStatus || 'PENDING').toLowerCase()}{agent.agencyPhone ? ` · ${agent.agencyPhone}` : ''}</p>}
                      {agent.avatar && (
                        <a
                          href={`/api/agent/avatar-download?url=${encodeURIComponent(agent.avatar)}&name=${encodeURIComponent(`${agent.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-profile.jpg`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#002045] hover:underline"
                        >
                          <Icon name="download" size={14} />
                          Download photo
                        </a>
                      )}
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
                    {agent.role !== 'ADMIN' && <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${isCorporate(agent) ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'}`}>{isCorporate(agent) ? 'Corporate' : 'Individual'}</span>}
                    {isCorporate(agent) && <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${agent.corporateStatus === 'DEMO' ? 'bg-sky-50 text-sky-700' : agent.corporatePaidThrough ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{agent.corporateStatus === 'DEMO' ? 'Demo' : agent.corporatePaidThrough ? 'Paid' : agent.corporateStatus === 'ACTIVE' ? 'Payment due' : 'Pending payment'}</span>}
                    {isCorporate(agent) && agent.corporatePaidThrough && <span className="rounded-md bg-[#f1f3f5] px-1.5 py-0.5 text-[11px] font-medium text-[#5b616b]">Paid through {new Date(agent.corporatePaidThrough).toLocaleDateString('en-GB')}</span>}
                    {agent.isVerified && (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">Verified</span>
                    )}
                    {agent.isFeatured && (
                      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">Featured</span>
                    )}
                    {agent.emailVerifiedAt ? (
                      <span
                        className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700"
                        title={`Email confirmed ${new Date(agent.emailVerifiedAt).toLocaleDateString('en-GB')}`}
                      >
                        Email verified
                      </span>
                    ) : (
                      <span
                        className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700"
                        title="Has not confirmed their email, so cannot sign in. Confirm it in Edit if you know the address is theirs."
                      >
                        Email not verified
                      </span>
                    )}
                    {agent.isHidden && (
                      <span
                        className="rounded-md bg-[#f1f3f5] px-1.5 py-0.5 text-[11px] font-medium text-[#5b616b]"
                        title="Not shown in the public agent directory"
                      >
                        Hidden
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end text-[13px] font-medium opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <DashboardActionMenu>
                    <button
                      onClick={() => openEdit(agent)}
                      disabled={busyId === agent.id}
                      className="rounded-md px-3 py-2 text-left text-[#002045] hover:bg-[#f7f9fb] disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <Link
                      href={`/dashboard/admin/agents/${agent.id}`}
                      className="rounded-md px-3 py-2 text-left text-[#74777f] hover:bg-[#f7f9fb] hover:text-[#002045]"
                    >
                      {isCorporate(agent) ? agent.corporatePaidThrough ? 'Payment & profile' : 'Confirm payment & activate' : 'Analytics'}
                    </Link>
                    <button
                      onClick={() => revoke(agent.id)}
                      disabled={busyId === agent.id}
                      className="rounded-md px-3 py-2 text-left text-[#845326] hover:bg-[#faf5ed] disabled:opacity-50"
                    >
                      Revoke
                    </button>
                    <button
                      onClick={() => remove(agent)}
                      disabled={busyId === agent.id}
                      className="rounded-md px-3 py-2 text-left text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                    </DashboardActionMenu>
                  </div>
                </td>
              </tr>
            ))}
            {visibleAgents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center text-sm text-[#9aa0a8]">
                  {agents.length === 0 ? 'No agent accounts yet. Add one to get started.' : 'No accounts in this group yet.'}
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
              <Icon name="close" />
            </button>
            <h3 className="text-base font-semibold text-[#002045]">{mode === 'create' ? 'Add new agent' : `Edit ${draft.name}`}</h3>
            <p className="mb-5 mt-0.5 text-sm text-[#74777f]">
              {mode === 'create' ? 'Create an individual professional or corporate agency account. Both can manage their own property listings.' : 'Update the account type, access, and public profile.'}
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600">{error}</div>
            )}

            <div className="mb-5 rounded-xl border border-[#e3e6ea] bg-[#fafbfc] p-4">
              <label className="mb-1 block text-[12px] font-semibold text-[#263b56]">Account type</label>
              <select value={draft.accountType ?? 'INDIVIDUAL'} onChange={(e) => {
                const nextType = e.target.value as AgentAccountType;
                set('accountType', nextType);
                if (nextType === 'CORPORATE') set('agencyPhone', draft.agencyPhone || draft.phone || '');
                else set('phone', draft.phone || draft.agencyPhone || '');
              }} className="w-full max-w-sm rounded-lg border border-[#e3e6ea] bg-white px-3 py-2.5 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10">
                <option value="INDIVIDUAL">Individual real estate agent</option>
                <option value="CORPORATE">Corporate agency</option>
              </select>
              <p className="mt-2 text-[12px] leading-5 text-[#74777f]">
                {draft.accountType === 'CORPORATE' ? 'The agency profile stays private while payment is pending. An admin activates it by granting a subscription.' : 'The professional profile appears in the agent directory when it is verified and visible.'}
              </p>
            </div>

            <SectionTitle>Account holder</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name / representative" value={draft.name ?? ''} onChange={(v) => set('name', v)} />
              <Field label="Login email" type="email" value={draft.email ?? ''} onChange={(v) => set('email', v)} disabled={mode === 'edit'} />
              <Field label={mode === 'create' ? 'Temporary password (8+ characters)' : 'Reset password (optional)'} type="password" value={draft.password ?? ''} onChange={(v) => set('password', v)} />
              <Field label="Professional title" value={draft.title ?? ''} onChange={(v) => set('title', v)} />
              <Field label="Primary service area (optional)" value={draft.location ?? ''} onChange={(v) => set('location', v)} />
              <div className={draft.accountType === 'CORPORATE' ? 'sm:col-span-2' : undefined}>
                <Field
                  label={draft.accountType === 'CORPORATE' ? 'Agency phone / WhatsApp number' : 'Contact phone'}
                  type="tel"
                  value={draft.accountType === 'CORPORATE' ? draft.agencyPhone ?? '' : draft.phone ?? ''}
                  onChange={(v) => {
                    set('phone', v);
                    if (draft.accountType === 'CORPORATE') set('agencyPhone', v);
                  }}
                  placeholder="+258 84 123 4567"
                />
                {draft.accountType === 'CORPORATE' && <p className="mt-1 text-[11px] text-[#74777f]">This number appears on the agency profile for calls and WhatsApp. Enter the full number; spaces and + are saved.</p>}
              </div>
              {draft.accountType !== 'CORPORATE' && <Field label="Office address (optional)" value={draft.officeAddress ?? ''} onChange={(v) => set('officeAddress', v)} />}
              {draft.accountType !== 'CORPORATE' && <Field label="Years of experience" type="number" value={String(Number.isFinite(draft.yearsExperience) ? draft.yearsExperience : 0)} onChange={(v) => set('yearsExperience', Number.isFinite(Number(v)) ? Number(v) : 0)} />}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-[#e3e6ea] bg-[#fafbfc] p-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-[#edf0f3]">
                {draft.avatar ? <Image src={draft.avatar} alt="Agent profile preview" fill className="object-cover" sizes="64px" /> : <div className="flex h-full items-center justify-center text-xl font-semibold text-[#718096]">{draft.initials || 'AG'}</div>}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#263b56]">Profile photo <span className="text-red-600">*</span></label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadAvatar(event.target.files?.[0])} className="mt-1 block max-w-full text-[12px] text-[#5b616b] file:mr-3 file:rounded-lg file:border-0 file:bg-[#002045] file:px-3 file:py-2 file:text-[12px] file:font-medium file:text-white" />
                <p className="mt-1 text-[11px] text-[#74777f]">JPG, PNG or WebP, up to 5 MB. {uploadingAvatar ? 'Uploading…' : draft.avatar ? 'Photo uploaded.' : 'Upload a clear portrait.'}</p>
              </div>
            </div>

            {draft.accountType === 'CORPORATE' ? (
              <>
                <SectionTitle className="mt-6">Agency profile</SectionTitle>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Agency / company name *" value={draft.agencyName ?? ''} onChange={(v) => set('agencyName', v)} />
                  <Field label="Business type (optional)" value={draft.agencyBusinessType ?? ''} onChange={(v) => set('agencyBusinessType', v)} placeholder="Property consultancy, brokerage…" />
                  <Field label="Office address (optional)" value={draft.officeAddress ?? ''} onChange={(v) => set('officeAddress', v)} placeholder="Building, street, bairro, city" />
                  <Field label="Public agency email" type="email" value={draft.agencyEmail ?? ''} onChange={(v) => set('agencyEmail', v)} />
                  <Field label="Website (https://)" value={draft.agencyWebsite ?? ''} onChange={(v) => set('agencyWebsite', v)} />
                </div>
                <TextArea label="Services offered (optional; separate with commas or new lines)" value={draft.agencyServicesText ?? ''} onChange={(v) => set('agencyServicesText', v)} />
                <TextArea label="Areas served (optional; separate with commas or new lines)" value={draft.agencyAreasServedText ?? ''} onChange={(v) => set('agencyAreasServedText', v)} />
                <TextArea label="About the agency (optional)" value={draft.agencyAbout ?? ''} onChange={(v) => set('agencyAbout', v)} />
              </>
            ) : (
              <>
                <SectionTitle className="mt-6">Professional profile</SectionTitle>
                <TextArea label="Specializations (optional; separate with commas or new lines)" value={draft.specializationsText ?? ''} onChange={(v) => set('specializationsText', v)} />
                <TextArea label="Professional biography" value={draft.bio ?? ''} onChange={(v) => set('bio', v)} />
              </>
            )}

            <div className="mt-5 rounded-xl border border-[#e3e6ea] bg-white p-4">
              <p className="text-[13px] font-semibold text-[#263b56]">Account access</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Create and manage own listings', 'Receive and respond to enquiries', 'Use agent dashboard'].map((permission) => (
                  <span key={permission} className="rounded-full bg-[#f1f3f5] px-2.5 py-1 text-[11px] font-medium text-[#526174]">{permission}</span>
                ))}
              </div>
              <p className="mt-2 text-[12px] leading-5 text-[#74777f]">Listing publication and corporate directory visibility follow the account’s plan and approval status.</p>
            </div>

            {mode === 'edit' && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Rating (0–5)" type="number" value={String(Number.isFinite(draft.rating) ? draft.rating : 0)} onChange={(v) => set('rating', Number.isFinite(Number(v)) ? Number(v) : 0)} />
                <Field label="Review count" type="number" value={String(Number.isFinite(draft.reviewCount) ? draft.reviewCount : 0)} onChange={(v) => set('reviewCount', Number.isFinite(Number(v)) ? Number(v) : 0)} />
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-5">
              <Toggle label="Verified" checked={!!draft.isVerified} onChange={(v) => set('isVerified', v)} />
              <Toggle label="Featured" checked={!!draft.isFeatured} onChange={(v) => set('isFeatured', v)} />
              {/* For demo, test and store-review accounts. The account keeps
                  every ability it has; it is only removed from the public
                  directory, where a visitor would read it as a real agency. */}
              <Toggle label="Hide from directory" checked={!!draft.isHidden} onChange={(v) => set('isHidden', v)} />
              {mode === 'edit' && (
                <Toggle
                  label="Email verified"
                  checked={draft.emailVerified ?? !!draft.emailVerifiedAt}
                  onChange={(v) => set('emailVerified', v)}
                />
              )}
              {mode === 'edit' && <div className="flex items-center gap-2">
                <label className="text-[12px] font-medium text-[#5b616b]">Role</label>
                <select
                  value={draft.role ?? 'AGENT'}
                  onChange={(e) => set('role', e.target.value)}
                  className="rounded-lg border border-[#e3e6ea] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#002045] outline-none"
                >
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>}
            </div>

            <div className="mt-7 flex justify-end gap-2.5">
              <button onClick={close} className="rounded-lg border border-[#e3e6ea] px-4 py-2 text-[13px] font-medium text-[#5b616b] hover:bg-[#f5f6f8]">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={isSaving || uploadingAvatar}
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
  label, value, onChange, type = 'text', disabled = false, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        maxLength={type === 'tel' ? 30 : undefined}
        autoComplete={type === 'tel' ? 'tel' : undefined}
        className="w-full min-w-0 rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10 disabled:bg-[#f5f6f8] disabled:opacity-70"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-4">
      <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">{label}</label>
      <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} className="w-full resize-y rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10" />
    </div>
  );
}

function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h4 className={`mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#596b80] ${className}`}>{children}</h4>;
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
