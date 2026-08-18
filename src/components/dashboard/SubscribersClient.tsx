'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  source: string;
  createdAt: string;
  lastEmailedAt: string | null;
}

const inputClass =
  'w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20';
const labelClass = 'block text-xs font-semibold text-[#374151] mb-1';

export default function SubscribersClient({
  subscribers: initial,
}: {
  subscribers: Subscriber[];
}) {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState(initial);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const active = subscribers.filter((s) => s.isActive);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subscribers;
    return subscribers.filter((s) => s.email.includes(term));
  }, [search, subscribers]);

  async function handleBroadcast() {
    if (!subject.trim()) {
      setNotice({ kind: 'error', text: 'Give the email a subject line.' });
      return;
    }
    if (!body.trim()) {
      setNotice({ kind: 'error', text: 'Write the message before sending.' });
      return;
    }
    if (!confirm(`Send this notification to all ${active.length} active subscriber(s)?`)) return;

    setSending(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/subscribers/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, body }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'The notification could not be sent.');

      const skipped = payload.failed?.length
        ? ` ${payload.failed.length} address(es) failed and were skipped.`
        : '';
      setNotice({
        kind: 'ok',
        text: `Sent to ${payload.sent} of ${payload.total} subscriber(s).${skipped}`,
      });
      setSubject('');
      setBody('');
      router.refresh();
    } catch (err: any) {
      setNotice({ kind: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  async function handleAdd() {
    if (!newEmail.trim()) return;
    setAdding(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newEmail }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Could not add that address.');

      setSubscribers((prev) => [
        payload.subscriber,
        ...prev.filter((s) => s.id !== payload.subscriber.id),
      ]);
      setNewEmail('');
      setNotice({
        kind: 'ok',
        text: payload.alreadySubscribed ? 'That address is already on the list.' : 'Subscriber added.',
      });
      router.refresh();
    } catch (err: any) {
      setNotice({ kind: 'error', text: err.message });
    } finally {
      setAdding(false);
    }
  }

  async function toggleActive(subscriber: Subscriber) {
    setBusyId(subscriber.id);
    try {
      const res = await fetch(`/api/admin/subscribers/${subscriber.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !subscriber.isActive }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSubscribers((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      router.refresh();
    } catch {
      setNotice({ kind: 'error', text: 'Could not update that subscriber.' });
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(subscriber: Subscriber) {
    if (!confirm(`Remove ${subscriber.email} from the list entirely?`)) return;
    setBusyId(subscriber.id);
    try {
      const res = await fetch(`/api/admin/subscribers/${subscriber.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      setSubscribers((prev) => prev.filter((s) => s.id !== subscriber.id));
      router.refresh();
    } catch {
      setNotice({ kind: 'error', text: 'Could not remove that subscriber.' });
    } finally {
      setBusyId(null);
    }
  }

  function copyAll() {
    navigator.clipboard
      .writeText(active.map((s) => s.email).join(', '))
      .then(() => setNotice({ kind: 'ok', text: `Copied ${active.length} active address(es).` }))
      .catch(() => setNotice({ kind: 'error', text: 'Could not copy to the clipboard.' }));
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#002045] tracking-tight">Newsletter subscribers</h1>
        <p className="text-sm text-[#74777f] mt-1">
          Everyone who signed up through the footer. Send them all one notification at once.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Subscribers', value: subscribers.length, icon: 'group' },
          { label: 'Active', value: active.length, icon: 'mark_email_read', color: 'text-emerald-600' },
          {
            label: 'Unsubscribed',
            value: subscribers.length - active.length,
            icon: 'unsubscribe',
            color: 'text-amber-500',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl px-5 py-4 border border-[#eceef1]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`material-symbols-outlined text-[20px] ${stat.color ?? 'text-[#002045]'}`}>
                {stat.icon}
              </span>
              <span className="text-[13px] text-[#74777f] font-medium">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold text-[#002045] tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {notice && (
        <div
          className={`rounded-lg border px-4 py-3 text-[13px] font-medium ${
            notice.kind === 'ok'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-red-100 bg-red-50 text-red-600'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Broadcast composer */}
      <div className="bg-white rounded-xl border border-[#eceef1] overflow-hidden">
        <div className="flex items-center gap-2 px-5 h-12 border-b border-[#eceef1]">
          <span className="material-symbols-outlined text-[19px] text-[#845326]">campaign</span>
          <h2 className="text-sm font-semibold text-[#002045]">Send a notification to all subscribers</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Subject *</label>
            <input
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="New beachfront listings in Inhambane"
            />
          </div>
          <div>
            <label className={labelClass}>Message *</label>
            <textarea
              rows={8}
              className={`${inputClass} resize-y`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the update here. Leave a blank line between paragraphs."
            />
            <p className="mt-1 text-[11px] text-[#9aa0a8]">
              Plain text — blank lines become paragraphs. Each subscriber gets their own email with an
              unsubscribe link, so nobody sees anyone else&apos;s address.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleBroadcast}
              disabled={sending || active.length === 0}
              className="flex items-center gap-1.5 bg-[#002045] text-white px-4 py-2.5 rounded-lg font-medium text-[13px] hover:bg-[#0a2f5c] transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              {sending ? 'Sending…' : `Send to ${active.length} subscriber(s)`}
            </button>
            <button
              onClick={copyAll}
              disabled={active.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#e0e0e0] text-[#374151] font-medium text-[13px] hover:bg-[#f5f6f8] transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              Copy addresses
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-[#eceef1] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#eceef1]">
          <h2 className="text-sm font-semibold text-[#002045]">The list</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="border border-[#e0e0e0] rounded-lg px-3 py-1.5 text-[13px] w-48 focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email…"
            />
            <input
              className="border border-[#e0e0e0] rounded-lg px-3 py-1.5 text-[13px] w-56 focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Add an address by hand"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newEmail.trim()}
              className="flex items-center gap-1 rounded-lg border border-[#e0e0e0] px-3 py-1.5 text-[13px] font-medium text-[#374151] hover:bg-[#f5f6f8] transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              Add
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#9aa0a8]">
            <span className="material-symbols-outlined text-4xl mb-2 text-[#d7dbe0] block">mail_outline</span>
            <p className="text-sm font-medium">
              {subscribers.length === 0 ? 'Nobody has subscribed yet.' : 'No address matches that search.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#f2f4f6]">
            {visible.map((subscriber) => (
              <li key={subscriber.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-[13px] font-medium text-[#002045] font-mono break-all">
                    {subscriber.email}
                  </p>
                  <p className="text-[11px] text-[#9aa0a8] mt-0.5">
                    Joined {new Date(subscriber.createdAt).toLocaleDateString()} · via {subscriber.source}
                    {subscriber.lastEmailedAt
                      ? ` · last emailed ${new Date(subscriber.lastEmailedAt).toLocaleDateString()}`
                      : ' · never emailed'}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    subscriber.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f5f6f8] text-[#9aa0a8]'
                  }`}
                >
                  {subscriber.isActive ? 'Active' : 'Unsubscribed'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(subscriber)}
                    disabled={busyId === subscriber.id}
                    title={subscriber.isActive ? 'Stop sending to this address' : 'Start sending again'}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9aa0a8] hover:bg-[#f5f6f8] hover:text-[#002045] transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {subscriber.isActive ? 'notifications_off' : 'notifications_active'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleRemove(subscriber)}
                    disabled={busyId === subscriber.id}
                    title="Remove from the list"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9aa0a8] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[19px]">delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
