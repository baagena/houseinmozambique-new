'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

const CONTACT_IMAGE =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop';

const SOCIALS = [
  {
    href: 'https://www.facebook.com/share/1CQYNNJEAG/?mibextid=wwXIfr',
    label: 'Facebook',
    icon: '/Platform=Facebook,%20Color=Original.svg',
  },
  {
    href: 'https://www.instagram.com/houseinmozambique?igsh=MXZ2eXMwZzBqano3NA%3D%3D&utm_source=qr',
    label: 'Instagram',
    icon: '/Platform=Instagram,%20Color=Original.svg',
  },
  {
    href: 'https://youtube.com/@houseinmozambique?si=ZS5ltZYL65cRMpmU',
    label: 'YouTube',
    icon: '/Platform=YouTube,%20Color=Original.svg',
  },
  {
    href: 'https://www.tiktok.com/@house_in_mozambique?_r=1&_t=ZS-96vgKrmit98',
    label: 'TikTok',
    icon: '/Platform=TikTok,%20Color=Original.svg',
  },
  {
    href: 'https://x.com/ebeb29238037?s=11',
    label: 'X',
    icon: '/Platform=X%20(Twitter),%20Color=Original.svg',
  },
];

export default function ContactPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        alert('Failed to send inquiry. Please try again.');
      }
    } catch (error) {
      console.error('Failed to submit form', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__bg">
          <Image src={CONTACT_IMAGE} alt="" fill priority className="object-cover" sizes="100vw" />
        </div>
        <div className="wrap">
          <span className="eyebrow">{t.contact.title}</span>
          <h1 className="display-l">
            {t.contact.heading1} {t.contact.heading2}
          </h1>
          <p>{t.contact.desc}</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="contact-grid">
            {/* ── Form ── */}
            <div className="form-card">
              <h2 className="block-h">{t.contact.sendMessage}</h2>

              {submitted ? (
                <div className="empty">
                  <span className="ico">
                    <span className="material-symbols-outlined text-[2.4rem] text-[var(--verified)]">
                      check_circle
                    </span>
                  </span>
                  <h3>{t.contact.messageSent}</h3>
                  <p>{t.contact.messageSentDesc}</p>
                  <button className="btn btn--ghost btn--sm" onClick={() => setSubmitted(false)}>
                    {t.contact.sendAnother}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-2">
                    <div>
                      <label className="field-l" htmlFor="c-name">
                        {t.contact.fullName}
                      </label>
                      <input
                        id="c-name"
                        type="text"
                        required
                        className="input"
                        placeholder="e.g. Maria Silva"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="field-l" htmlFor="c-email">
                        {t.contact.emailAddress}
                      </label>
                      <input
                        id="c-email"
                        type="email"
                        required
                        className="input"
                        placeholder="maria@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <label className="field-l" htmlFor="c-subject">
                    {t.contact.subject}
                  </label>
                  <input
                    id="c-subject"
                    type="text"
                    required
                    className="input"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />

                  <label className="field-l" htmlFor="c-message">
                    {t.contact.yourMessage}
                  </label>
                  <textarea
                    id="c-message"
                    required
                    className="textarea"
                    placeholder="Tell us what you're looking for…"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />

                  <button disabled={isSubmitting} className="btn btn--gold btn--full mt-6">
                    {isSubmitting ? t.contact.btnSending : t.contact.btnSend}
                    <span className="material-symbols-outlined text-[1.1rem]">send</span>
                  </button>
                </form>
              )}
            </div>

            {/* ── Offices ── */}
            <div>
              <h2 className="block-h">{t.contact.ourOffices}</h2>

              <div className="office">
                <span className="ic">
                  <span className="material-symbols-outlined text-[1.2rem]">location_on</span>
                </span>
                <div>
                  <h4>{t.contact.headquarters}</h4>
                  <p>
                    Av. Mozambique N1
                    <br />
                    Zimpeto, Maputo — Mozambique
                  </p>
                </div>
              </div>

              <div className="office">
                <span className="ic">
                  <span className="material-symbols-outlined text-[1.2rem]">call</span>
                </span>
                <div>
                  <h4>{t.contact.directLine}</h4>
                  <p className="mono text-[var(--ink)]">
                    <a href="tel:+258879329012">+258 879 329 012</a>
                  </p>
                  <p className="mono text-[0.72rem] uppercase tracking-[0.1em]">Mon – Fri, 8am – 6pm</p>
                </div>
              </div>

              <div className="office">
                <span className="ic">
                  <span className="material-symbols-outlined text-[1.2rem]">mail</span>
                </span>
                <div>
                  <h4>{t.contact.generalInquiries}</h4>
                  <p className="mono break-all text-[var(--ink)]">
                    <a href="mailto:info@houseinmozambique.com">info@houseinmozambique.com</a>
                  </p>
                  <p className="mono text-[0.72rem] uppercase tracking-[0.1em]">Avg. response 2h</p>
                </div>
              </div>

              <div className="hr" />

              <h5 className="mono mb-4 text-[0.7rem] uppercase tracking-[0.12em] text-[var(--hm-muted)]">
                {t.contact.followAgents}
              </h5>
              <div className="flex flex-wrap gap-3">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`House in Mozambique on ${s.label}`}
                    className="grid h-11 w-11 place-items-center rounded-[10px] border border-[var(--line)] bg-white transition-colors hover:border-[var(--gold)]"
                  >
                    <img src={s.icon} alt="" className="h-5 w-5 object-contain" />
                  </a>
                ))}
              </div>

              <div className="mv mv--dark mt-8">
                <span className="eyebrow">{t.contact.joinNetwork}</span>
                <p className="text-[0.92rem] leading-relaxed">{t.contact.joinNetworkDesc}</p>
                <Link href="/auth/agent-register" className="btn btn--gold btn--sm mt-5">
                  {t.contact.applyHere}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
