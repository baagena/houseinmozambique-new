'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

const heroImage =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1800';

export default function AboutPage() {
  const { t } = useLanguage();

  const services = [
    { icon: 'real_estate_agent', title: t.news.expertiseTitle, desc: t.news.expertiseDesc },
    { icon: 'campaign', title: t.news.advertisementTitle, desc: t.news.advertisementDesc },
    { icon: 'photo_camera', title: t.news.photographyTitle, desc: t.news.photographyDesc },
    { icon: 'verified', title: t.news.conciergeTitle, desc: t.news.conciergeDesc },
  ];

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__bg">
          <Image src={heroImage} alt="" fill priority className="object-cover" sizes="100vw" />
        </div>
        <div className="wrap">
          <span className="eyebrow">{t.about.title}</span>
          <h1 className="display-l">{t.about.heading}</h1>
          <p>{t.about.desc1}</p>
        </div>
      </section>

      {/* ── Row 1: the welcome ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.news.title}</span>
            <h2 className="display-s">{t.news.introLead}</h2>
          </div>
          {/* Two columns so a long intro reads as a block rather than a wall. */}
          <div className="text-cols muted leading-relaxed">
            <p>{t.about.desc2}</p>
            <p>{t.about.desc3}</p>
            <p>{t.news.intro1}</p>
            <p>{t.news.intro2}</p>
          </div>
        </div>
      </section>

      {/* ── Row 2: mission & vision ── */}
      <section className="section pt0">
        <div className="wrap">
          <div className="two-cards">
            <div className="mv">
              <span className="eyebrow">{t.about.missionTitle}</span>
              <p className="muted text-[0.92rem] leading-relaxed">{t.about.mission1}</p>
              <p className="muted mt-4 text-[0.92rem] leading-relaxed">{t.about.mission2}</p>
            </div>
            <div className="mv mv--dark">
              <span className="eyebrow">{t.about.visionTitle}</span>
              <p className="text-[0.92rem] leading-relaxed">{t.about.vision1}</p>
              <p className="mt-4 text-[0.92rem] leading-relaxed">{t.about.vision2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What we do ── */}
      <section className="section pt0">
        <div className="wrap">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">{t.news.sectionTitle}</span>
              <h2>How we serve the market</h2>
            </div>
            <Link href="/pricing" className="btn btn--gold btn--sm">
              {t.nav.postHouse}
            </Link>
          </div>

          <div className="serve">
            {services.map((service) => (
              <div key={service.title} className="item">
                <span className="ico">
                  <span className="material-symbols-outlined text-[1.1rem]">{service.icon}</span>
                </span>
                <h3 className="ui">{service.title}</h3>
                <p>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Commitment ── */}
      <section className="section pt0">
        <div className="wrap">
          <div className="commit">
            <div className="commit__body">
              <span className="eyebrow" style={{ color: '#e9c877' }}>
                {t.news.commitmentTitle}
              </span>
              <h2>{t.news.commitmentQuote}</h2>
              <p>{t.news.commitmentDesc1}</p>
              <p>{t.news.commitmentDesc2}</p>
            </div>
            <div className="commit__media">
              <Image
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=900"
                alt="House keys and property documents"
                fill
                className="object-cover"
                sizes="(max-width: 1000px) 100vw, 40vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section pt0">
        <div className="wrap">
          <div className="band">
            <div>
              <span className="eyebrow" style={{ color: '#e9c877' }}>
                {t.home.bandEyebrow}
              </span>
              <h2>{t.home.agentCtaTitle}</h2>
              <p>{t.home.agentCtaDesc}</p>
            </div>
            <div className="band__cta">
              <Link href="/pricing" className="btn btn--gold">
                {t.home.listPropertyBtn}
              </Link>
              <Link href="/contact" className="btn btn--light">
                {t.nav.contact}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
