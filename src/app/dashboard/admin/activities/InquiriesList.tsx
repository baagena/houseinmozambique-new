'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  propertyId?: string | null;
  agentId?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface InquiriesListProps {
  initialInquiries: Inquiry[];
}

export default function InquiriesList({ initialInquiries }: InquiriesListProps) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [filter, setFilter] = useState<'all' | 'messages' | 'newsletter'>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const visibleInquiries = inquiries.filter((inq) => {
    if (filter === 'newsletter') return inq.subject === 'Newsletter subscription';
    if (filter === 'messages') return inq.subject !== 'Newsletter subscription';
    return true;
  });

  const handleMarkRead = async (id: string) => {
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/inquiries/${id}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setInquiries(prev =>
          prev.map(inq => (inq.id === id ? { ...inq, isRead: true } : inq))
        );
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to mark inquiry as read:', err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this inquiry?')) return;
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/inquiries/${id}/delete`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setInquiries(prev => prev.filter(inq => inq.id !== id));
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
        {([
          { id: 'all', label: 'All activity' },
          { id: 'messages', label: 'Messages' },
          { id: 'newsletter', label: 'Newsletter' },
        ] as const).map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
              filter === item.id ? 'bg-[#002045] text-white' : 'bg-white text-[#5b616b] border border-[#e3e6ea] hover:bg-[#f5f6f8]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visibleInquiries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#eceef1] text-[#9aa0a8]">
          <span className="material-symbols-outlined text-4xl mb-2 text-[#d7dbe0] block">mail_outline</span>
          <p className="text-sm font-medium">No activity found</p>
        </div>
      ) : (
        visibleInquiries.map((inq) => {
          const isNewsletter = inq.subject === 'Newsletter subscription';

          return (
          <div
            key={inq.id}
            className={`bg-white p-5 rounded-xl border transition-colors ${
              inq.isRead
                ? 'border-[#eceef1] opacity-80'
                : 'border-[#845326]/25'
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-semibold text-[#002045] text-[15px] tracking-tight">{inq.subject}</span>
                  {isNewsletter && (
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-md">
                      Newsletter
                    </span>
                  )}
                  {!inq.isRead && (
                    <span className="px-1.5 py-0.5 bg-[#845326]/10 text-[#845326] text-[11px] font-medium rounded-md">
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

                <div className="flex gap-3 text-[13px] font-medium">
                  {!inq.isRead && (
                    <button
                      disabled={isProcessing !== null}
                      onClick={() => handleMarkRead(inq.id)}
                      className="text-[#002045] hover:underline disabled:opacity-50 flex items-center gap-1"
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
          </div>
          );
        })
      )}
    </div>
  );
}
