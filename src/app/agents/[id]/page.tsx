import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import Icon from '@/components/ui/Icon';
import { prisma } from '@/lib/db';
import { AGENT_PUBLIC } from '@/lib/dto';
import { buildMetadata } from '@/lib/seo';
import { getDirectoryVisibleWhere } from '@/lib/data';
import { agentMatchesProfileSegment, getAgentProfilePath, getAgentProfileSlug } from '@/lib/agent-profile-url';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: segment } = await params;
  const candidates = await prisma.agent.findMany({ where: getDirectoryVisibleWhere(), select: { id: true, name: true, agencyName: true, location: true, agencyAbout: true, bio: true } });
  const agent = candidates.find((candidate) => agentMatchesProfileSegment(candidate, segment));
  if (!agent) return buildMetadata({ title: 'Agent profile', path: `/agents/${segment}` });
  const name = agent.agencyName || agent.name;
  return buildMetadata({ title: `${name} | Real Estate in Mozambique`, description: agent.agencyAbout || agent.bio || `${name}, real estate professional in ${agent.location}, Mozambique.`, path: getAgentProfilePath(agent) });
}

export default async function AgentProfilePage({ params }: Props) {
  const { id: segment } = await params;
  const candidates = await prisma.agent.findMany({ where: getDirectoryVisibleWhere(), select: { id: true, name: true, agencyName: true } });
  const candidate = candidates.find((agent) => agentMatchesProfileSegment(agent, segment));
  if (!candidate) notFound();
  if (segment !== getAgentProfileSlug(candidate)) redirect(getAgentProfilePath(candidate));

  const agent = await prisma.agent.findFirst({
    where: { id: candidate.id, ...getDirectoryVisibleWhere() },
    select: {
      ...AGENT_PUBLIC,
      corporateStatus: true,
      properties: {
        where: { status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' }, take: 6,
        select: { id: true, title: true, city: true, location: true, price: true, priceUnit: true, type: true, bedrooms: true, bathrooms: true, area: true, images: true, listingType: true },
      },
      _count: { select: { properties: { where: { status: 'PUBLISHED' } } } },
    },
  });
  if (!agent) notFound();
  const canonicalSlug = getAgentProfileSlug(agent);
  if (segment !== canonicalSlug) redirect(getAgentProfilePath(agent));

  const corporate = Boolean(agent.agencyName);
  const publicName = agent.agencyName || agent.name;
  const phone = agent.agencyPhone || agent.phone;
  const digits = phone?.replace(/\D/g, '') || '';
  const whatsapp = digits.startsWith('258') ? digits : digits.startsWith('0') ? `258${digits.slice(1)}` : `258${digits}`;
  const areas = agent.agencyAreasServed.length ? agent.agencyAreasServed : [agent.location];

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-16 text-[var(--ink)]">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm text-[var(--hm-muted)]"><Link href="/" className="hover:text-[var(--gold-deep)]">Home</Link><Icon name="chevron_right" size={16} /><Link href="/agents" className="hover:text-[var(--gold-deep)]">Find an Agent</Link><Icon name="chevron_right" size={16} /><span className="truncate text-[var(--ink)]">{publicName}</span></nav>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <section className="relative isolate overflow-hidden rounded-3xl border border-[#e7eae6] bg-white shadow-sm">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#f4eee0] via-white to-white" />
              <div className="grid gap-7 p-5 sm:p-8 md:grid-cols-[230px_minmax(0,1fr)] md:items-center">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--paper)] shadow-sm">
                  {agent.avatar ? <SafeImage src={agent.avatar} alt={`${agent.name}, ${corporate ? 'agency representative' : 'real estate agent'}`} fill priority className="object-cover" sizes="(max-width: 768px) 80vw, 230px" /> : <div className="flex h-full items-center justify-center text-5xl font-semibold text-[var(--gold-deep)]">{agent.initials}</div>}
                  {agent.isVerified && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-3 py-2 text-xs font-semibold text-white"><Icon name="verified" size={15} /> Verified professional</span>}
                </div>
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f5efe3] px-3 py-1 text-xs font-semibold text-[var(--ink)]">{corporate ? 'Corporate agency' : 'Real estate professional'}</span>{agent.corporateStatus === 'DEMO' && <span className="rounded-full bg-[#f5efe3] px-3 py-1 text-xs font-semibold text-[var(--ink)]">DEMO · test profile</span>}{agent.isVerified && <span className="text-xs font-medium text-[var(--verified)]">Identity / business details verified</span>}</div>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{publicName}</h1>
                  <p className="mt-2 text-base text-[#56615c]">{corporate ? `${agent.agencyBusinessType || 'Real Estate'} · ` : `${agent.title} · `}{agent.location}, Mozambique</p>
                  <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#4d5853]">{corporate ? agent.agencyAbout || agent.bio || 'Contact the agency to learn more about its professional services.' : agent.bio || 'Contact this professional to learn about their property services.'}</p>
                  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 border-t border-[#e9ede9] pt-5 text-sm text-[#35423c]">
                    <span className="inline-flex items-center gap-2"><Icon name="location_on" size={18} className="text-[var(--gold-deep)]" />{agent.location}</span>
                    <span className="inline-flex items-center gap-2"><Icon name="apartment" size={18} className="text-[var(--gold-deep)]" />{agent._count.properties} active {agent._count.properties === 1 ? 'listing' : 'listings'}</span>
                    {agent.yearsExperience != null && <span className="inline-flex items-center gap-2"><Icon name="workspace_premium" size={18} className="text-[var(--gold-deep)]" />{agent.yearsExperience}+ years of experience</span>}
                  </div>
                  {corporate && <p className="mt-4 text-sm text-[#68736e]">Represented by {agent.name}</p>}
                </div>
              </div>
            </section>

            <section className="grid gap-5 rounded-3xl border border-[#e7eae6] bg-white p-5 shadow-sm sm:p-7 md:grid-cols-[0.85fr_1.4fr]">
              <div>
                <h2 className="text-lg font-semibold">{corporate ? 'About the business' : `About ${agent.name}`}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#59645f]">{corporate ? agent.agencyAbout || agent.bio : agent.bio || 'Get in touch to learn more about this professional.'}</p>
              </div>
              <div className="border-t border-[#edf0ed] pt-5 md:border-l md:border-t-0 md:pl-7 md:pt-0">
                <h2 className="text-lg font-semibold">{corporate ? 'Professional services' : 'Specializations'}</h2>
                <div className="mt-3 flex flex-wrap gap-2">{(corporate ? agent.agencyServices : agent.specializations).map((item) => <span key={item} className="rounded-full bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]">{item}</span>)}{!(corporate ? agent.agencyServices : agent.specializations).length && <span className="text-sm text-[var(--hm-muted)]">Contact for details.</span>}</div>
                <h2 className="mt-7 text-lg font-semibold">Areas served</h2>
                <div className="mt-3 flex flex-wrap gap-2">{areas.map((area) => <span key={area} className="inline-flex items-center gap-1 rounded-full border border-[#e5e9e5] px-3 py-1.5 text-xs text-[#45524b]"><Icon name="location_on" size={14} />{area}</span>)}</div>
                {agent.officeAddress && <a className="mt-4 inline-flex items-start gap-2 text-sm text-[var(--gold-deep)] hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(agent.officeAddress)}`} target="_blank" rel="noreferrer"><Icon name="map" size={17} />{agent.officeAddress}<Icon name="open_in_new" size={14} /></a>}
                {corporate && agent.agencyWebsite && <a className="mt-3 block text-sm font-medium text-[var(--gold-deep)] hover:underline" href={agent.agencyWebsite} target="_blank" rel="noreferrer">Visit agency website <Icon name="open_in_new" size={14} className="inline" /></a>}
              </div>
            </section>

            {!corporate && <section className="rounded-3xl border border-[#e7eae6] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-end justify-between"><div><h2 className="text-xl font-semibold">Properties by {corporate ? agent.agencyName : agent.name}</h2><p className="mt-1 text-sm text-[var(--hm-muted)]">Current listings represented by this {corporate ? 'agency' : 'professional'}.</p></div><Link href={`/properties?agent=${encodeURIComponent(agent.id)}`} className="hidden items-center gap-1 text-sm font-semibold text-[var(--gold-deep)] sm:inline-flex">View all <Icon name="arrow_forward" size={16} /></Link></div>
              {agent.properties.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{agent.properties.map((property) => <Link key={property.id} href={`/properties/${property.id}`} className="overflow-hidden rounded-2xl border border-[var(--line)] transition hover:-translate-y-0.5 hover:shadow-md"><div className="relative aspect-[4/3] bg-[var(--paper)]">{property.images[0] && <SafeImage src={property.images[0]} alt={property.title} fill className="object-cover" sizes="(max-width: 768px) 90vw, 350px" />}</div><div className="p-4"><p className="line-clamp-1 font-semibold">{property.title}</p><p className="mt-1 text-xs text-[var(--hm-muted)]">{property.location}, {property.city}</p><p className="mt-3 font-semibold text-[var(--gold-deep)]">{property.price.toLocaleString()} MZN <span className="text-xs font-normal text-[var(--hm-muted)]">{property.priceUnit === 'monthly' ? '/ month' : property.priceUnit === 'nightly' ? '/ night' : ''}</span></p></div></Link>)}</div> : <div className="rounded-2xl bg-[var(--paper)] p-6 text-sm text-[var(--hm-muted)]">No active listings are available right now. Contact the professional for current opportunities.</div>}
            </section>}
          </div>

          <aside className="h-fit overflow-hidden rounded-3xl border border-[#e7eae6] bg-white shadow-sm lg:sticky lg:top-5">
            <div className="bg-[var(--ink)] p-5 text-white"><h2 className="font-semibold !text-white">Get in touch</h2><p className="mt-1 text-sm text-white/75">Contact {corporate ? 'the agency' : agent.name} directly.</p></div>
            <div id="get-in-touch" className="grid grid-cols-3 gap-2 p-4">
              {phone && <a href={`tel:${phone}`} className="flex flex-col items-center gap-2 rounded-xl bg-[var(--paper)] p-3 text-xs font-semibold hover:bg-[var(--line)]"><Icon name="call" size={22} className="text-[var(--gold-deep)]" />Call</a>}
              {phone && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-xl bg-[var(--paper)] p-3 text-xs font-semibold hover:bg-[var(--line)]"><Icon name="chat" size={22} className="text-[var(--gold-deep)]" />WhatsApp</a>}
              {agent.agencyEmail && <a href={`mailto:${agent.agencyEmail}`} className="flex flex-col items-center gap-2 rounded-xl bg-[var(--paper)] p-3 text-xs font-semibold hover:bg-[var(--line)]"><Icon name="mail" size={22} className="text-[var(--gold-deep)]" />Email</a>}
            </div>
            {phone && <div className="px-5 pb-5"><a href={`tel:${phone}`} className="btn btn--gold btn--full"><Icon name="call" size={17} />Contact {corporate ? 'agency' : 'agent'}</a></div>}
            {corporate && phone && <p className="px-5 pb-4 text-center text-sm text-[#56615c]">Phone / WhatsApp: <a className="font-semibold text-[var(--ink)] hover:underline" href={`tel:${phone}`}>{phone}</a></p>}
            <div className="mx-5 border-t border-[#edf0ed] py-4 text-xs leading-5 text-[#68736e]">{agent.officeAddress ? <><span className="font-semibold text-[#26352e]">Office address</span><br />{agent.officeAddress}</> : `${agent.location}, Mozambique`}</div>
            {agent.isVerified && <div className="mx-5 mb-5 flex gap-2 rounded-xl bg-[#f5efe3] p-3 text-xs leading-5 text-[var(--ink)]"><Icon name="verified_user" size={17} className="text-[var(--verified)]" />Identity / business details verified by House in Mozambique.</div>}
          </aside>
        </div>
      </div>
    </main>
  );
}
