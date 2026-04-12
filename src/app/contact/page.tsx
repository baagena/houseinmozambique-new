'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const CONTACT_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock submit
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-1000">
          {/* Header */}
          <header className="mb-20 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#845326]/10 border border-[#845326]/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#845326] animate-pulse" />
              <span className="text-[10px] font-black text-[#845326] uppercase tracking-[0.2em]">Contact Us</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-[#002045] tracking-tighter leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-headline)' }}>
              Let's start a <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#002045] via-[#845326] to-[#fab983]">conversation</span>.
            </h1>
            <p className="text-xl text-[#74777f] font-medium max-w-2xl mx-auto leading-relaxed">
              Whether you're looking for your next home, an investment opportunity, or a professional partnership, our team is here to help.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Form Column */}
            <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-[0_32px_64px_rgba(0,32,69,0.08)] border border-[#f2f4f6]">
              <h2 className="text-3xl font-black text-[#002045] mb-8 tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>
                Send us a message
              </h2>

              {submitted ? (
                <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#002045] mb-2 tracking-tight">Message Sent!</h3>
                  <p className="text-[#74777f] font-medium mb-8">We'll get back to you within 24 hours.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-[#845326] font-black text-sm uppercase tracking-widest hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Full Name</label>
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
                      <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Email Address</label>
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
                    <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Subject</label>
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
                    <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Your Message</label>
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
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    <span className="material-symbols-outlined text-xl">send</span>
                  </button>
                </form>
              )}
            </div>

            {/* Info Column */}
            <div className="space-y-12 lg:pl-12">
              <div className="space-y-8">
                <h2 className="text-3xl font-black text-[#002045] tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>
                  Our Offices
                </h2>
                
                <div className="space-y-6">
                  {/* Address */}
                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 border border-[#f2f4f6] text-[#845326] group-hover:bg-[#845326] group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-2xl">location_on</span>
                    </div>
                    <div>
                      <h3 className="font-black text-[#002045] tracking-tight mb-1">Maputo Headquarters</h3>
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
                      <h3 className="font-black text-[#002045] tracking-tight mb-1">Direct Line</h3>
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
                      <h3 className="font-black text-[#002045] tracking-tight mb-1">General Inquiries</h3>
                      <p className="text-[#002045] font-black text-lg underline decoration-[#fab983]/30">hello@houseinmoz.com</p>
                      <p className="text-[10px] text-[#74777f] uppercase tracking-widest font-bold">Avg. response time: 2h</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Socials */}
              <div className="pt-12 border-t border-[#c4c6cf]/20">
                <h3 className="text-[10px] font-black text-[#74777f] uppercase tracking-[0.3em] mb-8">Follow Our Curation</h3>
                <div className="flex gap-4">
                  {['Instagram', 'LinkedIn', 'Facebook', 'X'].map((social) => (
                    <Link 
                      key={social}
                      href="#"
                      className="h-12 px-6 rounded-xl border border-[#c4c6cf]/30 flex items-center justify-center font-black text-xs text-[#002045] hover:bg-[#002045] hover:text-white hover:border-[#002045] transition-all"
                    >
                      {social}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recruitment Pitch */}
              <div className="bg-[#002045] rounded-[2rem] p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-700" />
                <h3 className="text-xl font-black mb-4 relative z-10" style={{ fontFamily: 'var(--font-headline)' }}>
                  Join our agent network?
                </h3>
                <p className="text-[#86a0cd] text-sm font-medium mb-8 leading-relaxed relative z-10">
                  We're always looking for talented curators to join Mozambique's premier network.
                </p>
                <Link 
                  href="/auth"
                  className="inline-flex items-center gap-2 text-[#fab983] font-black text-xs uppercase tracking-widest group/btn relative z-10"
                >
                  Apply Here
                  <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
