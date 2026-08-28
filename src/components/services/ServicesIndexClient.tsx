'use client';

import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { SERVICES, serviceHref } from '@/components/services/catalog';

const heroImage =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1800';

export default function ServicesIndexClient() {
  const { t } = useLanguage();

  return (
    <>
      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="page-hero__bg">
          <SafeImage src={heroImage} alt="" aria-hidden fill priority className="object-cover" sizes="100vw" />
        </div>
        <div className="wrap">
          <span className="eyebrow">{t.services.badge}</span>
          <h1 className="display-s">{t.services.heading}</h1>
          <p>{t.services.lead}</p>
        </div>
      </section>

      {/* ── The three services ── */}
      <section className="section">
        <div className="wrap">
          <div className="space-y-6">
            {SERVICES.map((service) => (
              <Link key={service.slug} href={serviceHref(service.slug)} className="feature group">
                <div className="feature__media" style={{ minHeight: 260 }}>
                  <SafeImage
                    src={service.image}
                    alt=""
                    aria-hidden
                    fill
                    className="object-cover"
                    sizes="(max-width: 1000px) 100vw, 55vw"
                  />
                  <span className="media-scrim" />
                  <span className="media-chip">
                    <span className="material-symbols-outlined text-[1.4rem]">{service.icon}</span>
                  </span>
                  <span className="media-index">{String(service.index).padStart(2, '0')}</span>
                </div>

                <div className="feature__body">
                  <span className="eyebrow">
                    {t.services.serviceNumber} {String(service.index).padStart(2, '0')}
                  </span>
                  <h2>{t.services[service.titleKey]}</h2>
                  <p className="muted">{t.services[service.taglineKey]}</p>
                  <span className="mono mt-6 inline-flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.1em] text-[var(--gold-deep)]">
                    {t.services.exploreService}
                    <span className="material-symbols-outlined text-[1rem] transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="section pt0">
        <div className="wrap">
          <div className="band">
            <div>
              <span className="eyebrow" style={{ color: '#e9c877' }}>
                {t.services.badge}
              </span>
              <h2>{t.services.contactTitle}</h2>
              <p>{t.services.contactDesc}</p>
            </div>
            <div className="band__cta">
              <Link href="/contact" className="btn btn--gold">
                {t.services.contactCta}
              </Link>
              <Link href="/pricing" className="btn btn--light">
                {t.services.pricingCta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
