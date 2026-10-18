import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { getAgentById } from '@/lib/data';
import { requireAdmin } from '@/lib/session';
import Icon from '@/components/ui/Icon';
import AdminGrantPlan from '@/components/dashboard/AdminGrantPlan';
import { prisma } from '@/lib/db';
import { getEntitlementState } from '@/lib/entitlements';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminAgentAnalyticsPage({ params }: Props) {
  // Layouts and pages render concurrently in RSC, so the guard in
  // dashboard/admin/layout.tsx does not stop this page's queries from running.
  // The check has to happen here, before any data is fetched.
  const admin = await requireAdmin();
  if (!admin) redirect('/auth');

  const { id } = await params;
  const agent = await getAgentById(id);

  if (!agent) {
    notFound();
  }

  // Plans the team can sell by hand: everything except the free tier.
  const [plans, entitlement, corporate] = await Promise.all([
    prisma.pricingPlan.findMany({
      where: { isActive: true, kind: { not: 'addon' }, NOT: { priceMinor: 0, ctaMode: 'checkout' } },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, namePt: true, nameEn: true, kind: true, pricePt: true, unitPt: true },
    }),
    getEntitlementState(agent.id, agent.role),
    prisma.agent.findUnique({
      where: { id },
      select: { email: true, agencyName: true, agencyPhone: true, officeAddress: true, corporateStatus: true, agencyBusinessType: true, agencyAbout: true, agencyServices: true, agencyAreasServed: true, agencyWebsite: true, agencyEmail: true },
    }),
  ]);

  const totalProperties = agent.properties?.length || 0;
  const liveCount = agent.properties?.filter((p) => p.status === 'PUBLISHED').length || 0;
  const pendingCount = agent.properties?.filter((p) => p.status === 'PENDING').length || 0;
  const rejectedCount = agent.properties?.filter((p) => p.status === 'REJECTED').length || 0;
  const agencyPhoneDigits = corporate?.agencyPhone?.replace(/\D/g, '') ?? '';
  const agencyWhatsapp = agencyPhoneDigits.startsWith('258') ? agencyPhoneDigits : agencyPhoneDigits.startsWith('0') ? `258${agencyPhoneDigits.slice(1)}` : `258${agencyPhoneDigits}`;

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

      <AdminGrantPlan
        agentId={agent.id}
        plans={plans.filter((p) => !(corporate?.corporateStatus || corporate?.agencyName) || p.kind === 'subscription').map((p) => ({ slug: p.slug, name: p.namePt || p.nameEn, kind: p.kind, price: `${p.pricePt} ${p.unitPt}`.trim() }))}
        currentPlan={entitlement.planName}
        credits={entitlement.credits}
        isCorporate={Boolean(corporate?.corporateStatus || corporate?.agencyName)}
      />

      {corporate?.corporateStatus && (
        <section className="rounded-3xl border border-[#f2f4f6] bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#845326] mb-2">Corporate request · {corporate.corporateStatus.toLowerCase()}</p>
          <h2 className="text-xl font-bold text-[#002045]">{corporate.agencyName}</h2>
          {corporate.agencyBusinessType && <p className="mt-1 text-sm text-[#5E6B7A]">{corporate.agencyBusinessType}</p>}
          {corporate.agencyAbout && <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5E6B7A]">{corporate.agencyAbout}</p>}
          {corporate.agencyServices.length > 0 && <p className="mt-3 text-sm text-[#5E6B7A]">Services: {corporate.agencyServices.join(' · ')}</p>}
          {corporate.agencyAreasServed.length > 0 && <p className="mt-2 text-sm text-[#5E6B7A]">Areas: {corporate.agencyAreasServed.join(' · ')}</p>}
          {corporate.officeAddress && <p className="mt-2 text-sm text-[#5E6B7A]">Office: {corporate.officeAddress}</p>}
          {corporate.agencyWebsite && <a className="mt-2 inline-block text-sm text-[#845326] underline" href={corporate.agencyWebsite} target="_blank" rel="noreferrer">{corporate.agencyWebsite}</a>}
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <a className="text-[#845326] underline" href={`mailto:${corporate.email}`}>Email {corporate.email}</a>
            {corporate.agencyEmail && <a className="text-[#845326] underline" href={`mailto:${corporate.agencyEmail}`}>Public agency email {corporate.agencyEmail}</a>}
            {corporate.agencyPhone && <a className="text-[#845326] underline" href={`tel:${corporate.agencyPhone}`}>Call {corporate.agencyPhone}</a>}
            {corporate.agencyPhone && <a className="text-[#845326] underline" href={`https://wa.me/${agencyWhatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          </div>
          {corporate.corporateStatus === 'PENDING' && <p className="mt-3 text-sm text-[#5E6B7A]">Review the business details and contact the agency directly to arrange payment. Grant the matching paid subscription above after payment is received; this activates the company profile in the public directory.</p>}
        </section>
      )}

      {agent.avatar && (
        <div className="flex items-center gap-5 rounded-3xl border border-[#f2f4f6] bg-white p-6 shadow-sm">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
            <Image src={agent.avatar} alt={agent.name} fill className="object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#002045]">{agent.name}&apos;s profile photo</p>
            <a
              href={`/api/agent/avatar-download?url=${encodeURIComponent(agent.avatar)}&name=${encodeURIComponent(`${agent.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-profile.jpg`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#845326] hover:underline"
            >
              <Icon name="download" size={16} />
              Download photo
            </a>
          </div>
        </div>
      )}

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
