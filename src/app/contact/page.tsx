'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

const CONTACT_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop';

export default function ContactPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
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
    <div className="bg-[#f7f9fb] flex flex-col">

      <main className="flex-1 pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-1000">
          {/* Header */}
          <header className="mb-20 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#845326]/10 border border-[#845326]/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#845326] animate-pulse" />
              <span className="text-[10px] font-black text-[#845326] uppercase tracking-[0.2em]">{t.contact.title}</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-[#002045] tracking-tighter leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-headline)' }}>
              {t.contact.heading1} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#002045] via-[#845326] to-[#fab983]">{t.contact.heading2}</span>.
            </h1>
            <p className="text-xl text-[#74777f] font-medium max-w-2xl mx-auto leading-relaxed">
              {t.contact.desc}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Form Column */}
            <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-[0_32px_64px_rgba(0,32,69,0.08)] border border-[#f2f4f6]">
              <h2 className="text-3xl font-black text-[#002045] mb-8 tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>
                {t.contact.sendMessage}
              </h2>

              {submitted ? (
                <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#002045] mb-2 tracking-tight">{t.contact.messageSent}</h3>
                  <p className="text-[#74777f] font-medium mb-8">{t.contact.messageSentDesc}</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-[#845326] font-black text-sm uppercase tracking-widest hover:underline"
                  >
                    {t.contact.sendAnother}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">{t.contact.fullName}</label>
                      <input
                        type="text"
                        required
                        className="w-full h-16 px-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-[#002045] font-bold"
                        placeholder="e.g. Maria Silva"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">{t.contact.emailAddress}</label>
                      <input
                        type="email"
                        required
                        className="w-full h-16 px-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-[#002045] font-bold"
                        placeholder="maria@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">{t.contact.subject}</label>
                    <input
                      type="text"
                      required
                      className="w-full h-16 px-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-[#002045] font-bold"
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">{t.contact.yourMessage}</label>
                    <textarea
                      rows={6}
                      required
                      className="w-full px-6 py-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-[#002045] font-bold resize-none"
                      placeholder="Tell us what you're looking for..."
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full h-16 bg-[#002045] text-white font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                  >
                    {isSubmitting ? t.contact.btnSending : t.contact.btnSend}
                    <span className="material-symbols-outlined text-xl">send</span>
                  </button>
                </form>
              )}
            </div>

            {/* Info Column */}
            <div className="space-y-12 lg:pl-12">
              <div className="space-y-8">
                <h2 className="text-3xl font-black text-[#002045] tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>
                  {t.contact.ourOffices}
                </h2>
                
                <div className="space-y-6">
                  {/* Address */}
                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 border border-[#f2f4f6] text-[#845326] group-hover:bg-[#845326] group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-2xl">location_on</span>
                    </div>
                    <div>
                      <h3 className="font-black text-[#002045] tracking-tight mb-1">{t.contact.headquarters}</h3>
                      <p className="text-[#74777f] font-medium leading-relaxed">
                        Av. Marginal, 145 <br />
                        Polana District, Maputo, Mozambique
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 border border-[#f2f4f6] text-[#845326] group-hover:bg-[#845326] group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-2xl">call</span>
                    </div>
                    <div>
                      <h3 className="font-black text-[#002045] tracking-tight mb-1">{t.contact.directLine}</h3>
                      <p className="text-[#002045] font-black text-lg">+258 84 123 4567</p>
                      <p className="text-[10px] text-[#74777f] uppercase tracking-widest font-bold">Mon - Fri, 8am - 6pm</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 border border-[#f2f4f6] text-[#845326] group-hover:bg-[#845326] group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-2xl">mail</span>
                    </div>
                    <div>
                      <h3 className="font-black text-[#002045] tracking-tight mb-1">{t.contact.generalInquiries}</h3>
                      <p className="text-[#002045] font-black text-lg underline decoration-[#fab983]/30">info@houseinmozambique.com</p>
                      <p className="text-[10px] text-[#74777f] uppercase tracking-widest font-bold">Avg. response time: 2h</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Socials */}
              <div className="pt-12 border-t border-[#c4c6cf]/20">
                <h3 className="text-[10px] font-black text-[#74777f] uppercase tracking-[0.3em] mb-8">{t.contact.followAgents}</h3>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.facebook.com/share/1CQYNNJEAG/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="House in Mozambique on Facebook"
                    className="w-12 h-12 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center transition-transform duration-200 transform hover:scale-110"
                  >
                    <img src="/Platform=Facebook,%20Color=Original.svg" alt="Facebook" className="w-6 h-6 object-contain" />
                  </a>

                  <a
                    href="https://www.instagram.com/houseinmozambique?igsh=MXZ2eXMwZzBqano3NA%3D%3D&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="House in Mozambique on Instagram"
                    className="w-12 h-12 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center transition-transform duration-200 transform hover:scale-110"
                  >
                    <img src="/Platform=Instagram,%20Color=Original.svg" alt="Instagram" className="w-6 h-6 object-contain" />
                  </a>

                  <a
                    href="https://youtube.com/@houseinmozambique?si=ZS5ltZYL65cRMpmU"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="House in Mozambique on YouTube"
                    className="w-12 h-12 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center transition-transform duration-200 transform hover:scale-110"
                  >
                    <img src="/Platform=YouTube,%20Color=Original.svg" alt="YouTube" className="w-6 h-6 object-contain" />
                  </a>

                  <a
                    href="https://www.tiktok.com/@house_in_mozambique?_r=1&_t=ZS-96vgKrmit98"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="House in Mozambique on TikTok"
                    className="w-12 h-12 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center transition-transform duration-200 transform hover:scale-110"
                  >
                    <img src="/Platform=TikTok,%20Color=Original.svg" alt="TikTok" className="w-6 h-6 object-contain" />
                  </a>

                  <a
                    href="https://x.com/ebeb29238037?s=11"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="House in Mozambique on X"
                    className="w-12 h-12 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center transition-transform duration-200 transform hover:scale-110"
                  >
                    <img src="/Platform=X%20(Twitter),%20Color=Original.svg" alt="X" className="w-6 h-6 object-contain" />
                  </a>
                </div>
              </div>

              {/* Recruitment Pitch */}
              <div className="bg-[#002045] rounded-[2rem] p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-700" />
                <h3 className="text-xl font-black mb-4 relative z-10" style={{ fontFamily: 'var(--font-headline)' }}>
                  {t.contact.joinNetwork}
                </h3>
                <p className="text-[#86a0cd] text-sm font-medium mb-8 leading-relaxed relative z-10">
                  {t.contact.joinNetworkDesc}
                </p>
                <Link 
                  href="/auth"
                  className="inline-flex items-center gap-2 text-[#fab983] font-black text-xs uppercase tracking-widest group/btn relative z-10"
                >
                  {t.contact.applyHere}
                  <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
