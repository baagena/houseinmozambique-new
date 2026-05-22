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
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

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
      {inquiries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#f2f4f6] text-[#74777f]">
          <span className="material-symbols-outlined text-4xl mb-3 text-slate-300 block">mail_outline</span>
          <p className="font-semibold">No inquiries found</p>
        </div>
      ) : (
        inquiries.map((inq) => (
          <div 
            key={inq.id} 
            className={`bg-white p-6 rounded-2xl border transition-all duration-300 ${
              inq.isRead 
                ? 'border-[#f2f4f6] opacity-75' 
                : 'border-[#845326]/20 shadow-[0_8px_30px_rgba(132,83,38,0.03)]'
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center flex-wrap gap-2.5">
                  <span className="font-extrabold text-[#002045] text-lg tracking-tight">{inq.subject}</span>
                  {!inq.isRead && (
                    <span className="px-2.5 py-0.5 bg-[#845326]/10 text-[#845326] text-[9px] font-black rounded-full uppercase tracking-wider">
                      New
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-[#74777f] font-medium flex flex-wrap items-center gap-1.5">
                  <span>From:</span>
                  <strong className="text-[#002045]">{inq.name}</strong>
                  <span className="text-slate-300">|</span>
                  <span className="font-mono text-slate-600">{inq.email}</span>
                </p>

                <p className="text-sm text-[#43474e] whitespace-pre-wrap leading-relaxed pt-3 border-t border-[#f2f4f6] mt-3">
                  {inq.message}
                </p>
              </div>

              <div className="text-left md:text-right flex flex-row md:flex-col justify-between md:justify-start items-center md:items-end gap-4 min-w-full md:min-w-[180px] pt-4 md:pt-0 border-t border-dashed border-[#f2f4f6] md:border-t-0">
                <p className="text-xs text-[#74777f] font-mono">
                  {new Date(inq.createdAt).toLocaleString()}
                </p>
                
                <div className="flex gap-2">
                  {!inq.isRead && (
                    <button
                      disabled={isProcessing !== null}
                      onClick={() => handleMarkRead(inq.id)}
                      className="px-4 py-2 bg-[#845326] text-white text-xs font-black rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                    >
                      {isProcessing === inq.id ? (
                        <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                      ) : (
                        <span>Mark read</span>
                      )}
                    </button>
                  )}
                  <button
                    disabled={isProcessing !== null}
                    onClick={() => handleDelete(inq.id)}
                    className="px-4 py-2 bg-red-500/10 text-red-600 text-xs font-black rounded-xl hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {isProcessing === inq.id ? (
                      <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                    ) : (
                      <span>Delete</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
