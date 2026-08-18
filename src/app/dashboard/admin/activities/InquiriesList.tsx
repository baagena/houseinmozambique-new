'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Reply {
  id: string;
  subject: string;
  body: string;
  sentBy: string;
  createdAt: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  propertyId?: string | null;
  agentId?: string | null;
  isRead: boolean;
  repliedAt?: string | null;
  replies?: Reply[];
  createdAt: string;
}

interface InquiriesListProps {
  initialInquiries: Inquiry[];
}

export default function InquiriesList({ initialInquiries }: InquiriesListProps) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Reply composer state, keyed by the message being answered.
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [notice, setNotice] = useState('');

  const visibleInquiries = inquiries.filter((inq) => {
    if (filter === 'answered') return Boolean(inq.repliedAt);
    if (filter === 'unanswered') return !inq.repliedAt;
    return true;
  });

  const openReply = (inq: Inquiry) => {
    setReplyingTo(inq.id);
    setReplySubject(`Re: ${inq.subject}`);
    setReplyBody('');
    setReplyError('');
    setNotice('');
  };

  const closeReply = () => {
    setReplyingTo(null);
    setReplySubject('');
    setReplyBody('');
    setReplyError('');
  };

  const handleSendReply = async (inq: Inquiry) => {
    if (!replyBody.trim()) {
      setReplyError('Write your answer before sending.');
      return;
    }

    setSending(true);
    setReplyError('');
    try {
      const res = await fetch(`/api/admin/inquiries/${inq.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject: replySubject, body: replyBody }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'The reply could not be sent.');

      setInquiries((prev) =>
        prev.map((item) =>
          item.id === inq.id
            ? {
                ...item,
                isRead: true,
                repliedAt: payload.reply.createdAt,
                replies: [...(item.replies ?? []), payload.reply],
              }
            : item
        )
      );
      setNotice(`Your answer was emailed to ${inq.email}.`);
      closeReply();
      router.refresh();
    } catch (err: any) {
      setReplyError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/inquiries/${id}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setInquiries((prev) => prev.map((inq) => (inq.id === id ? { ...inq, isRead: true } : inq)));
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to mark inquiry as read:', err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/inquiries/${id}/delete`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setInquiries((prev) => prev.filter((inq) => inq.id !== id));
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { id: 'all', label: `All messages (${inquiries.length})` },
            { id: 'unanswered', label: `Needs an answer (${inquiries.filter((i) => !i.repliedAt).length})` },
            { id: 'answered', label: `Answered (${inquiries.filter((i) => i.repliedAt).length})` },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
              filter === item.id
                ? 'bg-[#002045] text-white'
                : 'bg-white text-[#5b616b] border border-[#e3e6ea] hover:bg-[#f5f6f8]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
          {notice}
        </div>
      )}

      {visibleInquiries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#eceef1] text-[#9aa0a8]">
          <span className="material-symbols-outlined text-4xl mb-2 text-[#d7dbe0] block">mail_outline</span>
          <p className="text-sm font-medium">No messages found</p>
        </div>
      ) : (
        visibleInquiries.map((inq) => {
          const isAnswered = Boolean(inq.repliedAt);
          const isComposing = replyingTo === inq.id;

          return (
            <div
              key={inq.id}
              className={`bg-white p-5 rounded-xl border transition-colors ${
                inq.isRead ? 'border-[#eceef1]' : 'border-[#845326]/25'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-semibold text-[#002045] text-[15px] tracking-tight">
                      {inq.subject}
                    </span>
                    {isAnswered ? (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-md">
                        Answered
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-[#845326]/10 text-[#845326] text-[11px] font-medium rounded-md">
                        Needs an answer
                      </span>
                    )}
                    {!inq.isRead && (
                      <span className="px-1.5 py-0.5 bg-[#002045]/[0.07] text-[#002045] text-[11px] font-medium rounded-md">
                        New
                      </span>
                    )}
                  </div>

                  <p className="text-[13px] text-[#74777f] flex flex-wrap items-center gap-1.5 min-w-0">
                    <span>From</span>
                    <strong className="font-medium text-[#002045]">{inq.name}</strong>
                    <span className="text-[#d7dbe0]">·</span>
                    <span className="font-mono text-[#5b616b] break-all">{inq.email}</span>
                  </p>

                  <p className="text-[13px] text-[#43474e] whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed pt-3 border-t border-[#f2f4f6] mt-3">
                    {inq.message}
                  </p>
                </div>

                <div className="text-left md:text-right flex flex-row md:flex-col justify-between md:justify-start items-center md:items-end gap-3 w-full md:w-auto md:min-w-[170px] pt-3 md:pt-0 border-t border-dashed border-[#f2f4f6] md:border-t-0">
                  <p className="text-[12px] text-[#9aa0a8] font-mono">
                    {new Date(inq.createdAt).toLocaleString()}
                  </p>

                  <div className="flex flex-wrap gap-3 text-[13px] font-medium">
                    <button
                      onClick={() => (isComposing ? closeReply() : openReply(inq))}
                      className="text-[#002045] hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">reply</span>
                      {isComposing ? 'Cancel' : isAnswered ? 'Reply again' : 'Reply by email'}
                    </button>
                    {!inq.isRead && (
                      <button
                        disabled={isProcessing !== null}
                        onClick={() => handleMarkRead(inq.id)}
                        className="text-[#5b616b] hover:underline disabled:opacity-50 flex items-center gap-1"
                      >
                        {isProcessing === inq.id ? (
                          <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                        ) : (
                          <span>Mark read</span>
                        )}
                      </button>
                    )}
                    <button
                      disabled={isProcessing !== null}
                      onClick={() => handleDelete(inq.id)}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {isProcessing === inq.id ? (
                        <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      ) : (
                        <span>Delete</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Answers already sent */}
              {(inq.replies?.length ?? 0) > 0 && (
                <div className="mt-4 space-y-2">
                  {inq.replies!.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-lg bg-[#f7f9fb] border-l-[3px] border-[#845326] px-4 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa0a8]">
                        Answered by {reply.sentBy} · {new Date(reply.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-1.5 text-[13px] font-medium text-[#002045]">{reply.subject}</p>
                      <p className="mt-1 text-[13px] text-[#43474e] whitespace-pre-wrap break-words leading-relaxed">
                        {reply.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply composer */}
              {isComposing && (
                <div className="mt-4 rounded-xl border border-[#eceef1] bg-[#fafbfc] p-4 space-y-3">
                  <p className="text-[12px] text-[#74777f]">
                    Sending to <strong className="font-mono text-[#002045]">{inq.email}</strong>. Their
                    reply comes back to the team inbox.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1">Subject</label>
                    <input
                      className="w-full border border-[#e0e0e0] rounded-lg px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      placeholder={`Re: ${inq.subject}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1">Your answer</label>
                    <textarea
                      rows={6}
                      className="w-full border border-[#e0e0e0] rounded-lg px-3.5 py-2.5 text-sm bg-white resize-y focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Write your answer here. Their original message is quoted underneath automatically."
                    />
                  </div>

                  {replyError && (
                    <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
                      {replyError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSendReply(inq)}
                      disabled={sending}
                      className="flex items-center gap-1.5 bg-[#002045] text-white px-4 py-2 rounded-lg font-medium text-[13px] hover:bg-[#0a2f5c] transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[17px]">send</span>
                      {sending ? 'Sending…' : 'Send answer'}
                    </button>
                    <button
                      onClick={closeReply}
                      className="px-4 py-2 rounded-lg border border-[#e0e0e0] text-[#374151] font-medium text-[13px] hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
