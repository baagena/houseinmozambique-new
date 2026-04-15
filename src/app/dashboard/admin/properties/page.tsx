import { getPropertiesForAdmin } from '@/lib/data';
import Image from 'next/image';
import AdminPropertyActions from '@/components/dashboard/AdminPropertyActions';

export default async function AdminPropertiesPage() {
  const allProperties = await getPropertiesForAdmin();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#002045]">Global Property Inventory</h2>
        <span className="text-[10px] font-black text-[#845326] bg-[#845326]/10 px-4 py-2 rounded-full uppercase tracking-widest">{allProperties.length} Assets Identified</span>
      </div>

      <div className="bg-white rounded-[2rem] border border-[#f2f4f6] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/50">
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Property Asset</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Host / Agent</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-right">Admin Control</th>
            </tr>
          </thead>
          <tbody>
            {allProperties.map((p) => (
              <tr key={p.id} className="border-b border-[#f2f4f6] hover:bg-[#f7f9fb] transition-colors">
                <td className="px-6 py-4 flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <Image src={p.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=200'} alt={p.title} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-[#002045] text-sm">{p.title}</p>
                    <p className="text-[10px] text-[#74777f] uppercase font-bold tracking-tight">{p.city}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-[#002045]">{p.host ? p.host.name : 'System Generated'}</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        p.status === 'PUBLISHED' ? 'bg-emerald-500' : 
                        p.status === 'REJECTED' ? 'bg-red-500' : 'bg-[#fab983]'
                      }`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        p.status === 'PUBLISHED' ? 'text-emerald-600' : 
                        p.status === 'REJECTED' ? 'text-red-600' : 'text-[#845326]'
                      }`}>
                        {p.status}
                      </span>
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                   <AdminPropertyActions propertyId={p.id} currentStatus={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
