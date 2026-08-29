'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import AgentCard from '@/components/agents/AgentCard';
import SafeImage from '@/components/ui/SafeImage';

interface AgentsClientProps {
  featured: any[];
  allAgents: any[];
}

const PAGE_SIZE = 12;
const PAGE_HERO =
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1800&auto=format&fit=crop';

export default function AgentsClient({ featured, allAgents }: AgentsClientProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allAgents;
    return allAgents.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q) ||
        a.title?.toLowerCase().includes(q)
    );
  }, [allAgents, query]);

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__bg">
          <SafeImage src={PAGE_HERO} alt="" fill priority className="object-cover" sizes="100vw" />
        </div>
        <div className="wrap">
          <span className="eyebrow">{t.agents.featuredExperts}</span>
          <h1 className="display-l">
            {t.agents.title} {t.agents.title2}
          </h1>
          <p>{t.agents.desc}</p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-title-row">
              <h2>{t.agents.featuredExperts}</h2>
              <span className="mono text-[0.76rem] text-[var(--hm-muted)]">{featured.length}</span>
            </div>
            <div className="dir-grid">
              {featured.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section pt0">
        <div className="wrap">
          <div className="inv-head">
            <div>
              <h2>{t.agents.professionalDirectory}</h2>
              <p className="count">
                {filtered.length} {t.nav.agents.toLowerCase()}
              </p>
            </div>
            <div className="w-full max-w-[320px]">
              <input
                type="search"
                className="input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                placeholder={t.propertiesList.searchPlaceholder}
                aria-label={t.propertiesList.searchPlaceholder}
              />
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="dir-grid">
              {filtered.slice(0, visible).map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <span className="ico">
                <span className="material-symbols-outlined text-[1.7rem]">person_search</span>
              </span>
              <h3>{t.propertiesList.noProperties}</h3>
              <p>{t.propertiesList.tryAdjusting}</p>
            </div>
          )}

          {visible < filtered.length && (
            <div className="inv-load">
              <button className="btn btn--ghost" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                {t.agents.showMore}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="section pt0">
        <div className="wrap">
          <div className="band">
            <div>
              <span className="eyebrow" style={{ color: '#e9c877' }}>
                {t.home.bandEyebrow}
              </span>
              <h2>
                {t.agents.joinNetwork} {t.agents.joinNetwork2}
              </h2>
              <p>{t.agents.joinDesc}</p>
            </div>
            <div className="band__cta">
              <Link href="/pricing" className="btn btn--gold">
                {t.agents.listProperty}
              </Link>
              <Link href="/auth/agent-register" className="btn btn--light">
                {t.agents.partnerWithUs}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
