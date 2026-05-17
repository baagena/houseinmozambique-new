'use client';

import { deleteProperty, updatePropertyStatus } from '@/actions/admin';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  propertyId: string;
  currentStatus: string;
  onView?: () => void;
}

export default function AdminPropertyActions({ propertyId, currentStatus, onView }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleStatusUpdate = async (newStatus: 'PUBLISHED' | 'REJECTED') => {
    setIsPending(true);
    try {
      const res = await updatePropertyStatus(propertyId, newStatus);
      if (!res.success) {
        alert(res.error);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Action failed.');
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this listing? This cannot be undone.')) {
      return;
    }

    setIsPending(true);
    try {
      const res = await deleteProperty(propertyId);
      if (!res.success) {
        alert(res.error);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Delete action failed.');
    } finally {
      setIsPending(false);
    }
  };

  if (currentStatus === 'PENDING') {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {onView && (
          <button
            onClick={onView}
            className="text-[10px] font-black text-[#002045] uppercase tracking-widest hover:underline cursor-pointer"
          >
            View
          </button>
        )}
        <button
          onClick={() => handleStatusUpdate('REJECTED')}
          disabled={isPending}
          className="text-[10px] font-black text-red-500 uppercase hover:underline disabled:opacity-50 cursor-pointer"
        >
          Reject
        </button>
        <button
          onClick={() => handleStatusUpdate('PUBLISHED')}
          disabled={isPending}
          className="text-[10px] font-black text-[#845326] bg-[#845326]/10 px-3 py-1.5 rounded-lg uppercase tracking-wider hover:bg-[#845326]/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'Processing...' : 'Publish'}
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 disabled:opacity-50 cursor-pointer"
        >
          Delete Permanent
        </button>
      </div>
    );
  }

  if (currentStatus === 'PUBLISHED') {
    return (
      <div className="flex justify-end gap-3">
        <button
          onClick={() => handleStatusUpdate('REJECTED')}
          disabled={isPending}
          className="text-[10px] font-black text-[#74777f] uppercase hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Suspend
        </button>
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">verified</span>
          Live
        </span>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
       <button
          onClick={() => handleStatusUpdate('PUBLISHED')}
          disabled={isPending}
          className="text-[10px] font-black text-[#002045] uppercase hover:underline disabled:opacity-50 cursor-pointer"
        >
          Restore
        </button>
    </div>
  );
}
