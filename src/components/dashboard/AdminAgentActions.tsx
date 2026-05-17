'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { revokeAgentAccess } from '@/actions/admin';

interface AdminAgentActionsProps {
  agentId: string;
}

export default function AdminAgentActions({ agentId }: AdminAgentActionsProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleRevoke = async () => {
    if (!confirm('Revoke this agent\'s access?')) {
      return;
    }

    setIsPending(true);
    const response = await revokeAgentAccess(agentId);
    setIsPending(false);

    if (!response.success) {
      alert(response.error || 'Unable to revoke agent access.');
      return;
    }

    router.refresh();
  };

  return (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={handleRevoke}
        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Revoke Access
      </button>
      <Link
        href={`/dashboard/admin/agents/${agentId}`}
        className="text-[10px] font-black text-[#002045] uppercase tracking-widest hover:underline"
      >
        Full Analytics
      </Link>
    </div>
  );
}
