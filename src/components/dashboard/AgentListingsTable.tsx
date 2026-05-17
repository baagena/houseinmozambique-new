'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteAgentProperty } from '@/actions/properties';

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

export default function AgentListingsTable({ properties }: AgentListingsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing permanently?')) {
      return;
    }

    setDeletingId(id);
    const response = await deleteAgentProperty(id);
    setDeletingId(null);

    if (!response.success) {
      alert(response.error || 'Unable to delete the listing.');
      return;
    }

    router.refresh();
  };

  return (
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
          {properties.map((property) => (
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
                <p className="text-sm font-black text-[#002045]">${property.price.toLocaleString()}</p>
                <p className="text-[9px] text-[#845326] font-bold uppercase tracking-widest">
                  {property.priceUnit === 'sale' ? 'Purchase' : 'Per month'}
                </p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    property.status === 'PUBLISHED' ? 'bg-emerald-500' :
                    property.status === 'REJECTED' ? 'bg-red-500' : 'bg-[#fab983]'
                  }`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    property.status === 'PUBLISHED' ? 'text-emerald-600' :
                    property.status === 'REJECTED' ? 'text-red-500' : 'text-[#845326]'
                  }`}>
                    {property.status === 'PUBLISHED' ? 'Live' : property.status === 'REJECTED' ? 'Rejected' : 'Awaiting Review'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/post-property?edit=${property.id}`} className="text-[10px] font-black text-[#74777f] uppercase hover:text-[#002045] transition-colors">
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={deletingId === property.id}
                    onClick={() => handleDelete(property.id)}
                    className="text-[10px] font-black text-red-400 uppercase hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Permanent
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
