import Image from 'next/image';
import Link from 'next/link';
import { getAgents, getFeaturedAgents } from '@/lib/data';
import AgentCard from '@/components/agents/AgentCard';

export default async function AgentsPage() {
  const allAgents = await getAgents();
  const featured = await getFeaturedAgents();

  return (
    <div className="pt-32 pb-24 bg-[#f7f9fb]">
      {/* Header */}
      <header className="max-w-4xl mx-auto text-center px-6 mb-16">
        <h1
          className="text-5xl font-black tracking-tight text-[#002045] mb-6 leading-tight"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Work with the Best<br />Real Estate Agents
        </h1>
        <p className="text-lg text-[#43474e] max-w-2xl mx-auto font-medium opacity-70">
          Our professional directory of real estate experts is here to guide you through Mozambique&apos;s most exclusive property opportunities.
        </p>
      </header>

      {/* Featured Agents */}
      <section className="max-w-[1440px] mx-auto px-8 mb-24">
        <div className="flex items-center gap-6 mb-12">
          <h2 className="text-3xl font-black text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
            Featured Experts
          </h2>
          <div className="h-0.5 flex-grow bg-[#002045]/5" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {featured.map((agent) => (
            <AgentCard key={agent.id} agent={agent as any} size="large" />
          ))}
        </div>
      </section>

      {/* All Agents */}
      <section className="max-w-[1440px] mx-auto px-8 mb-24">
        <div className="flex items-center gap-6 mb-12">
          <h2 className="text-3xl font-black text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
            Professional Directory
          </h2>
          <div className="h-0.5 flex-grow bg-[#002045]/5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {allAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent as any} size="small" />
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <button className="px-12 py-5 bg-white border border-[#c4c6cf]/30 text-[#002045] font-black rounded-2xl hover:bg-[#002045] hover:text-[#febc85] transition-all duration-500 shadow-xl shadow-[#002045]/5 uppercase tracking-widest text-xs">
            Show More Professionals
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1440px] mx-auto px-8 mb-24">
        <div className="relative rounded-[3rem] overflow-hidden bg-[#002045] text-white p-12 md:p-24 shadow-[0_40px_80px_rgba(0,32,69,0.25)]">
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none hidden lg:block">
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 200 200">
              <path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.3,87,-15.7,86.1,-0.5C85.2,14.6,80,29.3,71.7,42.1C63.4,54.9,52,65.8,38.9,73.5C25.8,81.2,12.9,85.6,-1.1,87.6C-15.1,89.5,-30.2,88.9,-44,83.1C-57.8,77.3,-70.2,66.2,-78.4,52.6C-86.6,39.1,-90.6,23.1,-90.6,7.1C-90.6,-8.9,-86.6,-24.9,-78.4,-38.5C-70.2,-52,-57.8,-63.1,-44,-70.3C-30.2,-77.5,-15.1,-80.7,-0.5,-79.8C14,-78.9,28.1,-73.9,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>
              Join Our Global<br />Network
            </h2>
            <p className="text-xl text-white/60 mb-12 leading-relaxed font-medium">
              Elevate your professional journey with the most prestigious real estate platform in Mozambique. Partner with us to list your properties.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link href="/post-property" className="bg-[#febc85] text-[#002045] px-10 py-5 rounded-[1.5rem] font-black text-xs tracking-widest uppercase shadow-2xl hover:-translate-y-1 transition-all duration-500 text-center">
                List Property
              </Link>
              <Link href="/auth/agent-register" className="bg-white/5 backdrop-blur-3xl border border-white/10 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs tracking-widest uppercase hover:bg-white/10 transition-all duration-500 text-center">
                Partner With Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
