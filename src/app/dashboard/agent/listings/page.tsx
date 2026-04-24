import { getAgentById } from '@/lib/data';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';

export default async function AgentListingsPage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) redirect('/auth');

  const agent = await getAgentById(agentId);
  
  if (!agent) notFound();
  const myProperties = agent.properties || [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-[#002045] tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>Your Listings</h2>
          <p className="text-xs text-[#74777f] font-medium uppercase tracking-widest mt-1">Manage your architectural portfolio</p>
        </div>
      </div>

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
            {myProperties.map((p) => (
              <tr key={p.id} className="hover:bg-[#f7f9fb] transition-colors group">
                <td className="px-6 py-4 flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-sm">
                    <Image src={p.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=200'} alt={p.title} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-[#002045] text-sm tracking-tight">{p.title}</p>
                    <p className="text-[10px] text-[#74777f] font-bold uppercase tracking-tight">{p.city}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <p className="text-sm font-black text-[#002045]">${p.price.toLocaleString()}</p>
                   <p className="text-[9px] text-[#845326] font-bold uppercase tracking-widest">{p.priceUnit === 'sale' ? 'Purchase' : 'per month'}</p>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center justify-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        p.status === 'PUBLISHED' ? 'bg-emerald-500' : 
                        p.status === 'REJECTED' ? 'bg-red-500' : 'bg-[#fab983]'
                      }`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        p.status === 'PUBLISHED' ? 'text-emerald-600' : 
                        p.status === 'REJECTED' ? 'text-red-500' : 'text-[#845326]'
                      }`}>
                        {p.status === 'PENDING' ? 'Awaiting Review' : p.status === 'PUBLISHED' ? 'Live' : 'Rejected'}
                      </span>
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-[10px] font-black text-[#74777f] uppercase hover:text-[#002045] transition-colors">Edit</button>
                      <button className="text-[10px] font-black text-red-400 uppercase hover:text-red-600 transition-colors">Delist</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
