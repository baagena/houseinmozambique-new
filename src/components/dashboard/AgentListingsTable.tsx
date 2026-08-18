'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  deleteAgentProperty,
  republishAgentProperty,
  suspendAgentProperty,
} from '@/actions/properties';

type AgentListing = {
  id: string;
  title: string;
  city: string;
  price: number;
  priceUnit: string;
  status: string;
  images: string[];
};

interface AgentListingsTableProps {
  properties: AgentListing[];
}

const STATUS_LABELS: Record<string, { label: string; dot: string; text: string }> = {
  PUBLISHED: { label: 'Live', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  REJECTED: { label: 'Rejected', dot: 'bg-red-500', text: 'text-red-500' },
  SUSPENDED: { label: 'Suspended', dot: 'bg-[#9aa0a8]', text: 'text-[#74777f]' },
  PENDING: { label: 'Awaiting Review', dot: 'bg-[#fab983]', text: 'text-[#845326]' },
};

export default function AgentListingsTable({ properties }: AgentListingsTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const run = async (id: string, action: () => Promise<{ success: boolean; error?: string }>) => {
    setBusyId(id);
    setError('');
    const response = await action();
    setBusyId(null);

    if (!response.success) {
      setError(response.error || 'That action could not be completed.');
      return;
    }

    router.refresh();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this listing permanently? Suspending it instead keeps the details for later.')) {
      return;
    }
    return run(id, () => deleteAgentProperty(id));
  };

  const handleSuspend = (id: string) => {
    if (!confirm('Suspend this listing? It will be removed from the public site until you reactivate it.')) {
      return;
    }
    return run(id, () => suspendAgentProperty(id));
  };

  const handleReactivate = (id: string) => run(id, () => republishAgentProperty(id));

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-[#f2f4f6] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/50">
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Property Asset</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Pricing</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-center">Publication Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-right">Portfolio Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f4f6]">
            {properties.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-[#9aa0a8]">
                  You have no listings yet.
                </td>
              </tr>
            )}

            {properties.map((property) => {
              const status = STATUS_LABELS[property.status] ?? STATUS_LABELS.PENDING;
              const isSuspended = property.status === 'SUSPENDED';
              const isBusy = busyId === property.id;

              return (
                <tr key={property.id} className="hover:bg-[#f7f9fb] transition-colors group">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-sm">
                      <Image
                        src={property.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=200'}
                        alt={property.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-[#002045] text-sm tracking-tight">{property.title}</p>
                      <p className="text-[10px] text-[#74777f] font-bold uppercase tracking-tight">{property.city}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-[#002045]">MT {property.price.toLocaleString()}</p>
                    <p className="text-[9px] text-[#845326] font-bold uppercase tracking-widest">
                      {property.priceUnit === 'sale' ? 'Purchase' : 'Per month'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <Link
                        href={`/post-property?edit=${property.id}`}
                        className="text-[10px] font-black text-[#74777f] uppercase hover:text-[#002045] transition-colors"
                      >
                        Edit
                      </Link>
                      {isSuspended ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleReactivate(property.id)}
                          className="text-[10px] font-black text-emerald-600 uppercase hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleSuspend(property.id)}
                          className="text-[10px] font-black text-[#845326] uppercase hover:text-[#002045] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDelete(property.id)}
                        className="text-[10px] font-black text-red-400 uppercase hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete Permanent
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
