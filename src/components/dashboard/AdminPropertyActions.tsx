'use client';

import { deleteProperty as serverDeleteProperty } from '@/actions/admin';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DashboardActionMenu from '@/components/dashboard/DashboardActionMenu';

interface Props {
  propertyId: string;
  currentStatus: string;
  onView?: () => void;
  onEdit?: () => void;
}

export default function AdminPropertyActions({ propertyId, currentStatus, onView, onEdit }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleStatusUpdate = async (newStatus: 'PUBLISHED' | 'REJECTED') => {
    setIsPending(true);
    try {
      const res = await fetch(`/api/admin/property/${propertyId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      }).then(r => r.json());
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
      // Use server action deleteProperty as fallback for delete (keeps same behavior)
      const res = await serverDeleteProperty(propertyId);
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
      <DashboardActionMenu>
        <Link
          href={`/properties/${propertyId}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md px-3 py-2 text-left text-[10px] font-black text-[#315f8d] uppercase hover:bg-[#edf5fb]"
        >
          View property
        </Link>
        {onView && (
          <button
            onClick={onView}
            className="rounded-md px-3 py-2 text-left text-[10px] font-black text-[#002045] uppercase hover:bg-[#f7f9fb]"
          >
            View
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="rounded-md px-3 py-2 text-left text-[10px] font-black text-[#002045] uppercase hover:bg-[#f7f9fb]"
          >
            Edit
          </button>
        )}
        <button
          onClick={() => handleStatusUpdate('REJECTED')}
          disabled={isPending}
          className="rounded-md px-3 py-2 text-left text-[10px] font-black text-red-500 uppercase hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={() => handleStatusUpdate('PUBLISHED')}
          disabled={isPending}
          className="rounded-md px-3 py-2 text-left text-[10px] font-black text-[#845326] uppercase hover:bg-[#faf5ed] disabled:opacity-50"
        >
          {isPending ? 'Processing...' : 'Publish'}
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-md px-3 py-2 text-left text-[10px] font-black text-red-500 uppercase hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
          Delete Permanent
        </button>
      </DashboardActionMenu>
    );
  }

  if (currentStatus === 'PUBLISHED') {
    return (
      <DashboardActionMenu>
        <Link
          href={`/properties/${propertyId}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md px-3 py-2 text-left text-[10px] font-black text-[#315f8d] uppercase hover:bg-[#edf5fb]"
        >
          View property
        </Link>
        {onEdit && (
          <button
            onClick={onEdit}
            className="rounded-md px-3 py-2 text-left text-[10px] font-black text-[#002045] uppercase hover:bg-[#f7f9fb]"
          >
            Edit property
          </button>
        )}
        <button
          onClick={() => handleStatusUpdate('REJECTED')}
          disabled={isPending}
          className="rounded-md px-3 py-2 text-left text-[10px] font-black text-[#74777f] uppercase hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
        >
          Suspend
        </button>
        <span className="flex items-center gap-1 rounded-md px-3 py-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">verified</span>
          Live
        </span>
      </DashboardActionMenu>
    );
  }

  return (
    <DashboardActionMenu>
      <Link
        href={`/properties/${propertyId}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-md px-3 py-2 text-left text-[10px] font-black text-[#315f8d] uppercase hover:bg-[#edf5fb]"
      >
        View property
      </Link>
      {onEdit && (
        <button
          onClick={onEdit}
          className="rounded-md px-3 py-2 text-left text-[10px] font-black text-[#002045] uppercase hover:bg-[#f7f9fb]"
        >
          Edit property
        </button>
      )}
       <button
          onClick={() => handleStatusUpdate('PUBLISHED')}
          disabled={isPending}
          className="rounded-md px-3 py-2 text-left text-[10px] font-black text-[#002045] uppercase hover:bg-[#f7f9fb] disabled:opacity-50"
        >
          Restore
        </button>
    </DashboardActionMenu>
  );
}
