import { getAgents } from '@/lib/data';
import Image from 'next/image';

export default async function AdminAgentsPage() {
  const allAgents = await getAgents();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#002045]">Verified Agents</h2>
        <span className="text-[10px] font-black text-[#845326] bg-[#845326]/10 px-4 py-2 rounded-full uppercase tracking-widest">{allAgents.length} Active Professionals</span>
      </div>

      <div className="bg-white rounded-[2rem] border border-[#f2f4f6] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#f2f4f6] bg-[#f7f9fb]/50">
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Agent Detail</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Portfolio Size</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest">Market Score</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#74777f] uppercase tracking-widest text-right">Status Control</th>
            </tr>
          </thead>
          <tbody>
            {allAgents.map((agent) => (
              <tr key={agent.id} className="border-b border-[#f2f4f6] hover:bg-[#f7f9fb] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#f2f4f6]">
                      {agent.avatar ? (
                        <Image src={agent.avatar} alt={agent.name} fill className="object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#1a365d] font-black text-[10px]">
                          {agent.initials}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-[#002045] text-sm tracking-tight">{agent.name}</p>
                      <p className="text-[10px] text-[#74777f] font-medium uppercase tracking-tight">{agent.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#002045]">{(agent as any)._count?.properties || 0} Listed Assets</span>
                      <span className="text-[9px] text-[#c4c6cf] font-black uppercase tracking-widest">Live Portfolio</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#fab983]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-xs font-black text-[#002045]">{agent.rating}</span>
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-[10px] font-black text-red-500 uppercase">Revoke Access</button>
                      <button className="text-[10px] font-black text-[#002045] uppercase hover:underline">Full Analytics</button>
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
