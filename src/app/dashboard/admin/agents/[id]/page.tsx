import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getAgentById } from '@/lib/data';

interface Props {
  params: { id: string };
}

export default async function AdminAgentAnalyticsPage({ params }: Props) {
  const agent = await getAgentById(params.id);

  if (!agent) {
    notFound();
  }

  const totalProperties = agent.properties?.length || 0;
  const liveCount = agent.properties?.filter((p) => p.status === 'PUBLISHED').length || 0;
  const pendingCount = agent.properties?.filter((p) => p.status === 'PENDING').length || 0;
  const rejectedCount = agent.properties?.filter((p) => p.status === 'REJECTED').length || 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#002045] tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
            Analytics for {agent.name}
          </h1>
          <p className="text-[#74777f] font-medium">Review listings, performance and status across the agent portfolio.</p>
        </div>
        <Link
          href="/dashboard/admin/agents"
          className="text-[10px] font-black uppercase tracking-widest text-[#845326] border border-[#845326] px-5 py-3 rounded-full hover:bg-[#845326]/10 transition-colors"
        >
          Back to Agent List
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-[#f2f4f6]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#845326] mb-4">Total Properties</p>
          <p className="text-5xl font-black text-[#002045]">{totalProperties}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-[#f2f4f6]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#845326] mb-4">Live Listings</p>
          <p className="text-5xl font-black text-[#002045]">{liveCount}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-[#f2f4f6]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#845326] mb-4">Pending Reviews</p>
          <p className="text-5xl font-black text-[#002045]">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-[#f2f4f6] shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-[#f2f4f6]">
          <h2 className="text-xl font-black text-[#002045]">Agent Portfolio</h2>
          <p className="text-sm text-[#74777f] mt-1">{agent.name} currently manages {totalProperties} properties.</p>
        </div>
        <div className="divide-y divide-[#f2f4f6]">
          {agent.properties?.map((property) => (
            <div key={property.id} className="px-8 py-6 hover:bg-[#f7f9fb] transition-colors">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-[#002045]">{property.title}</h3>
                  <p className="text-xs uppercase tracking-wider text-[#845326] font-black mt-2">{property.city}</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                  <span className={property.status === 'PUBLISHED' ? 'text-emerald-600' : property.status === 'PENDING' ? 'text-[#845326]' : 'text-red-500'}>
                    {property.status}
                  </span>
                  <Link href={`/properties/${property.id}`} className="text-[#002045] hover:underline">
                    Preview
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
