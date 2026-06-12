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

      <main className="flex-1 pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto animate-in fade-in duration-1000">
          {/* Header */}
          <header className="mb-12 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#845326]/10 border border-[#845326]/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#845326] animate-pulse" />
              <span className="text-[10px] font-black text-[#845326] uppercase tracking-[0.2em]">{t.contact.title}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-[#002045] tracking-tight leading-tight mb-4" style={{ fontFamily: 'var(--font-headline)' }}>
              {t.contact.heading1} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#002045] via-[#845326] to-[#fab983]">{t.contact.heading2}</span>.
            </h1>
            <p className="text-sm text-[#74777f] font-medium max-w-2xl mx-auto leading-relaxed">
              {t.contact.desc}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Form Column */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-[#f2f4f6]">
              <h2 className="text-lg font-black text-[#002045] mb-6 tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
                {t.contact.sendMessage}
              </h2>

              {submitted ? (
                <div className="py-8 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">check_circle</span>
                  </div>
                  <h3 className="text-base font-black text-[#002045] mb-2 tracking-tight">{t.contact.messageSent}</h3>
                  <p className="text-[#74777f] font-medium text-sm mb-6">{t.contact.messageSentDesc}</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-[#845326] font-black text-xs uppercase tracking-widest hover:underline"
                  >
                    {t.contact.sendAnother}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">{t.contact.fullName}</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#f7f9fb] border border-[#c4c6cf]/30 focus:ring-2 focus:ring-[#002045]/10 text-[#002045] font-medium text-sm outline-none"
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
                        className="w-full px-4 py-3 rounded-xl bg-[#f7f9fb] border border-[#c4c6cf]/30 focus:ring-2 focus:ring-[#002045]/10 text-[#002045] font-medium text-sm outline-none"
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
                      className="w-full px-4 py-3 rounded-xl bg-[#f7f9fb] border border-[#c4c6cf]/30 focus:ring-2 focus:ring-[#002045]/10 text-[#002045] font-medium text-sm outline-none"
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">{t.contact.yourMessage}</label>
                    <textarea
                      rows={4}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[#f7f9fb] border border-[#c4c6cf]/30 focus:ring-2 focus:ring-[#002045]/10 text-[#002045] font-medium text-sm resize-none outline-none"
                      placeholder="Tell us what you're looking for..."
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#002045] text-white font-black text-sm rounded-xl shadow-sm hover:bg-[#003055] transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? t.contact.btnSending : t.contact.btnSend}
                    <span className="material-symbols-outlined text-base">send</span>
                  </button>
                </form>
              )}
            </div>

            {/* Info Column */}
            <div className="space-y-8 lg:pl-8">
              <div className="space-y-5">
                <h2 className="text-lg font-black text-[#002045] tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
                  {t.contact.ourOffices}
                </h2>
                
                <div className="space-y-4">
                  {/* Address */}
                  <div className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 border border-[#f2f4f6] text-[#845326] group-hover:bg-[#845326] group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                    </div>
                    <div>
                      <h3 className="font-black text-[#002045] tracking-tight text-sm mb-1">{t.contact.headquarters}</h3>
                      <p className="text-[#74777f] font-medium text-sm leading-relaxed">
                        Av. Marginal, 145 <br />
                        Polana District, Maputo, Mozambique
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 border border-[#f2f4f6] text-[#845326] group-hover:bg-[#845326] group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-lg">call</span>
                    </div>
                    <div>
                      <h3 className="font-black text-[#002045] tracking-tight text-sm mb-1">{t.contact.directLine}</h3>
                      <p className="text-[#002045] font-black text-sm">+258 84 123 4567</p>
                      <p className="text-[10px] text-[#74777f] uppercase tracking-widest font-bold">Mon - Fri, 8am - 6pm</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 border border-[#f2f4f6] text-[#845326] group-hover:bg-[#845326] group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-lg">mail</span>
                    </div>
                    <div>
                      <h3 className="font-black text-[#002045] tracking-tight text-sm mb-1">{t.contact.generalInquiries}</h3>
                      <p className="text-[#002045] font-black text-sm underline decoration-[#fab983]/30">info@houseinmozambique.com</p>
                      <p className="text-[10px] text-[#74777f] uppercase tracking-widest font-bold">Avg. response time: 2h</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Socials */}
              <div className="pt-6 border-t border-[#c4c6cf]/20">
                <h3 className="text-[10px] font-black text-[#74777f] uppercase tracking-[0.3em] mb-4">{t.contact.followAgents}</h3>
                <div className="flex gap-3">
                  {['Instagram', 'LinkedIn', 'Facebook', 'X'].map((social) => (
                    <Link 
                      key={social}
                      href="#"
                      className="px-4 py-2 rounded-lg border border-[#c4c6cf]/30 flex items-center justify-center font-black text-xs text-[#002045] hover:bg-[#002045] hover:text-white hover:border-[#002045] transition-all"
                    >
                      {social}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recruitment Pitch */}
              <div className="bg-[#002045] rounded-xl p-6 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700" />
                <h3 className="text-base font-black mb-3 relative z-10" style={{ fontFamily: 'var(--font-headline)' }}>
                  {t.contact.joinNetwork}
                </h3>
                <p className="text-[#86a0cd] text-xs font-medium mb-4 leading-relaxed relative z-10">
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
