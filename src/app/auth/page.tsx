'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { setAuth } from '@/lib/auth';

// Professional, agent-focused hero image
const BG_IMG = 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop';

const SPECIALIZATIONS = [
  'Luxury Villas', 'Expat Relocations', 'Polana District', 
  'Investment Properties', 'Waterfront Properties', 'Retail Spaces',
  'Commercial Leasing', 'Rural Properties', 'Matola Market'
];

const TITLES = [
  'Junior Partner', 'Senior Partner', 'Premier Curator', 
  'Investment Specialist', 'Luxury Advisor', 'Relocation Expert'
];

const REGISTRATION_STEPS = [
  {
    id: 1,
    title: 'Getting Started',
    description: 'Create your account and choose a secure password.',
    icon: 'vignette'
  },
  {
    id: 2,
    title: 'Professional Info',
    description: 'Tell us where you work and your experience details.',
    icon: 'distance'
  },
  {
    id: 3,
    title: 'Your Profile',
    description: 'Write a short bio and pick your specialties for the directory.',
    icon: 'edit_note'
  }
];

const IS_DEV = process.env.NODE_ENV === 'development';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    // Step 2 Professional
    title: 'Premier Curator',
    location: '',
    yearsExperience: 1,
    // Step 3 Narrative
    bio: '',
    specializations: [] as string[],
  });

  const redirect = searchParams.get('redirect') || '/';
  const plan = searchParams.get('plan');

  const handleAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    // Mock Authentication Logic
    setTimeout(() => {
      const userRole = formData.email.includes('admin') ? 'admin' : 'agent';
      setAuth({
        isLoggedIn: true,
        userName: formData.name || (userRole === 'admin' ? 'System Admin' : 'Premium Agent'),
        role: userRole,
        selectedPlan: plan || null,
        isDevAutoLogin: false,
      });
      
      const dashboardPath = userRole === 'admin' ? '/dashboard/admin' : '/dashboard/agent';
      router.push(dashboardPath);
      setIsLoading(false);
    }, 1500);
  };

  const handleDevQuickLogin = (role: 'admin' | 'agent' = 'agent') => {
    setIsLoading(true);
    setAuth({
      isLoggedIn: true,
      userName: role === 'admin' ? 'Dev Admin' : 'Dev Agent',
      role: role,
      selectedPlan: plan || 'Premium',
      isDevAutoLogin: true,
    });
    router.push(role === 'admin' ? '/dashboard/admin' : '/dashboard/agent');
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <main className="min-h-screen flex flex-col md:flex-row md:h-screen md:overflow-hidden">
      {/* Left: Professional Editorial Visual */}
      <section className="hidden md:flex md:w-5/12 lg:w-1/2 relative overflow-hidden bg-[#002045] items-center p-12 lg:p-24 uppercase-off">
        <div className="absolute inset-0 z-0 scale-105">
          <Image src={BG_IMG} alt="Professional Agency Office" fill className="object-cover opacity-50 brightness-[0.7] mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002045] via-[#002045]/40 to-transparent opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002045]/40 via-transparent to-transparent opacity-60" />
        </div>
        
        <div className="relative z-10 w-full max-w-xl">


          {tab === 'signin' ? (
            /* Sign In Left Side: Existing Branding */
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-1000">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Agent Access</span>
              </div>
              
              <h2 className="text-4xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>
                Grow your business <br />
                as a <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#fab983] to-[#845326]">Professional</span> Agent.
              </h2>
              
              <p className="text-lg lg:text-xl text-[#86a0cd] font-medium leading-relaxed max-w-md">
                Join Mozambique's most exclusive network of real estate professionals. Access premium listings, powerful tools, and a global clientele.
              </p>

              <footer className="pt-12 border-t border-white/10 flex items-center gap-12 mt-12">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-xl border-2 border-[#002045] bg-[#f2f4f6] flex items-center justify-center overflow-hidden">
                       <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-400" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-white font-black text-sm tracking-tight leading-none mb-1">Elite Network</p>
                  <p className="text-[10px] text-[#86a0cd] uppercase tracking-widest font-bold">280+ Certified Partners</p>
                </div>
              </footer>
            </div>
          ) : (
            /* Sign Up Left Side: Step-by-Step Registration Guide */
            <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-1000">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#845326]/20 backdrop-blur-xl border border-[#845326]/30">
                  <span className="w-2 h-2 rounded-full bg-[#fab983] animate-pulse" />
                  <span className="text-[10px] font-black text-[#fab983] uppercase tracking-[0.2em]">Registration Journey</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-[1.1]" style={{ fontFamily: 'var(--font-headline)' }}>
                   Create your <br /> Agent Profile.
                </h2>
              </div>

              <div className="relative space-y-6">
                {/* Connecting Line */}
                <div className="absolute left-6 top-8 bottom-8 w-px bg-white/10" />

                {REGISTRATION_STEPS.map((s) => {
                  const isActive = step === s.id;
                  const isCompleted = step > s.id;

                  return (
                    <div key={s.id} className={`relative flex gap-8 transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                      {/* Step Indicator */}
                      <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-700 border ${isActive ? 'bg-[#845326] text-white border-[#fab983]/30 shadow-[0_0_30px_rgba(132,83,38,0.4)] scale-110' : isCompleted ? 'bg-emerald-500/80 text-white border-emerald-400/30' : 'bg-white/5 text-white/50 border-white/10'}`}>
                        {isCompleted ? (
                          <span className="material-symbols-outlined text-xl">check</span>
                        ) : (
                          <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                        )}
                      </div>

                      {/* Step Content */}
                      <div className={`flex-1 p-5 rounded-3xl transition-all duration-700 ${isActive ? 'bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl' : ''}`}>
                        <h3 className="text-white font-black text-lg tracking-tight mb-1.5 flex justify-between items-center transition-colors">
                          {s.title}
                          {isActive && <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#fab983] animate-pulse">Active Phase</span>}
                        </h3>
                        <p className={`text-sm font-medium leading-relaxed transition-colors ${isActive ? 'text-[#86a0cd]' : 'text-[#86a0cd]/60'}`}>
                          {s.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>


      </section>

      {/* Right: Modern Multi-step Form */}
      <section className="flex-1 flex flex-col bg-white overflow-y-auto">
        <header className="flex justify-between items-center px-8 lg:px-12 py-10">
          <Link href="/" className="md:hidden font-black text-[#002045] text-2xl tracking-tighter [font-family:var(--font-headline)]">
             HIM.
          </Link>
          <nav className="flex gap-8 ml-auto items-center">
            <Link href="/" className="text-xs font-black text-[#74777f] hover:text-[#002045] uppercase tracking-widest transition-colors">Portal</Link>
            <Link href="/agents" className="text-xs font-black text-[#74777f] hover:text-[#002045] uppercase tracking-widest transition-colors">Directory</Link>
          </nav>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-8 lg:px-24 py-12">
          <div className="w-full max-w-lg">
            {/* Minimalist Switcher */}
            <div className="flex gap-8 mb-16 border-b border-[#f2f4f6]">
              <button
                onClick={() => { setTab('signin'); setStep(1); }}
                className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${tab === 'signin' ? 'text-[#002045]' : 'text-[#c4c6cf] hover:text-[#74777f]'}`}
              >
                Sign In
                {tab === 'signin' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#002045]" />}
              </button>
              <button
                onClick={() => setTab('signup')}
                className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${tab === 'signup' ? 'text-[#002045]' : 'text-[#c4c6cf] hover:text-[#74777f]'}`}
              >
                Agent Registration
                {tab === 'signup' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#002045]" />}
              </button>
            </div>

            {/* Step Indicator (signup only) */}
            {tab === 'signup' && (
              <div className="flex items-center gap-3 mb-10">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={`h-1 flex-1 rounded-full transition-all duration-700 ${s <= step ? 'bg-[#002045]' : 'bg-[#f2f4f6]'}`} 
                  />
                ))}
                <span className="text-[10px] font-black text-[#002045] ml-4 uppercase tracking-tighter">Step 0{step}</span>
              </div>
            )}

            <div className="mb-12">
              <h2 className="text-4xl font-black text-[#002045] mb-4 tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>
                {tab === 'signin' ? 'Welcome Back.' : step === 1 ? 'Get Started.' : step === 2 ? 'Your Details.' : 'About You.'}
              </h2>
              <p className="text-[#43474e] font-medium leading-relaxed">
                {tab === 'signin' 
                  ? 'Access your agent dashboard and manage your property listings.'
                  : step === 1 ? 'Create your account to begin your journey.' : step === 2 ? 'Tell us about your professional background and location.' : 'Tell us what you specialize in to show off on our directory.'}
              </p>
            </div>

            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              {tab === 'signin' ? (
                /* Login Form */
                <>
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Email Address</label>
                       <input
                        type="email"
                        required
                        className="w-full h-16 px-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-[#002045] font-bold"
                        placeholder="agent@houseinmoz.com"
                      />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                         <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Password</label>
                         <button className="text-[10px] font-black text-[#845326] uppercase tracking-[0.1em] hover:underline">Forgot?</button>
                       </div>
                       <input
                        type="password"
                        required
                        className="w-full h-16 px-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-[#002045] font-bold"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAuth}
                    className="w-full h-16 bg-[#002045] text-white font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    Sign In
                    <span className="material-symbols-outlined text-xl">login</span>
                  </button>
                </>
              ) : (
                /* Multi-step Registration */
                <>
                  {/* Step 1: Credentials */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Full Name</label>
                         <input
                          type="text"
                          required
                          className="w-full h-16 px-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-[#002045] font-bold"
                          placeholder="e.g. Ricardo Santos"
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
                          placeholder="ricardo@houseinmoz.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Create Password</label>
                         <input
                          type="password"
                          required
                          className="w-full h-16 px-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-[#002045] font-bold"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Professional Details */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Professional Role</label>
                          <select 
                            className="w-full h-16 px-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-[#002045] font-bold appearance-none"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                          >
                            {TITLES.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Experience (Years)</label>
                          <input
                            type="number"
                            className="w-full h-16 px-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-[#002045] font-bold"
                            value={formData.yearsExperience}
                            onChange={(e) => setFormData({...formData, yearsExperience: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Your Location</label>
                        <input
                          type="text"
                          required
                          className="w-full h-16 px-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-[#002045] font-bold"
                          placeholder="e.g. Maputo City, Polana"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Narrative */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">About You</label>
                        <textarea
                          rows={4}
                          className="w-full px-6 py-6 rounded-2xl bg-[#f7f9fb] border-none focus:ring-4 focus:ring-[#002045]/5 text-sm font-medium text-[#43474e] resize-none"
                          placeholder="Tell us a little about your experience and how you help clients..."
                          value={formData.bio}
                          onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]">Area Expertise</label>
                        <div className="flex flex-wrap gap-2">
                          {SPECIALIZATIONS.map(spec => (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => toggleSpecialization(spec)}
                              className={`px-4 py-2 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all ${formData.specializations.includes(spec) ? 'bg-[#845326] text-white' : 'bg-[#f7f9fb] text-[#74777f] hover:bg-[#e6e8ea]'}`}
                            >
                              {spec}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    {step > 1 && (
                      <button
                        onClick={prevStep}
                        className="flex-1 h-16 bg-[#f7f9fb] text-[#002045] font-black rounded-2xl hover:bg-[#e6e8ea] transition-all flex items-center justify-center gap-3"
                      >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back
                      </button>
                    )}
                    {step < 3 ? (
                      <button
                        onClick={nextStep}
                        className="flex-[2] h-16 bg-[#002045] text-white font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                      >
                        Save & Continue
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleAuth}
                        className="flex-[2] h-16 bg-[#845326] text-white font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                      >
                        Complete Registration
                        <span className="material-symbols-outlined">how_to_reg</span>
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Enhanced Social Integration */}
              <div className="relative py-10 flex items-center">
                <div className="flex-grow border-t border-[#f2f4f6]" />
                <span className="flex-shrink mx-6 text-[9px] font-black text-[#c4c6cf] uppercase tracking-[0.3em]">Sign in with</span>
                <div className="flex-grow border-t border-[#f2f4f6]" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button type="button" className="flex items-center justify-center gap-4 h-16 border border-[#f2f4f6] rounded-2xl hover:bg-[#f7f9fb] transition-all group">
                   <svg className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-xs font-black text-[#002045] uppercase tracking-wider">Google Work</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-4 h-16 border border-[#f2f4f6] rounded-2xl hover:bg-[#f7f9fb] transition-all group">
                   <svg className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" fill="#0077B5"/>
                  </svg>
                  <span className="text-xs font-black text-[#002045] uppercase tracking-wider">LinkedIn Pro</span>
                </button>
              </div>

              {IS_DEV && (
                <div className="mt-12 p-8 bg-[#fef9f2] rounded-3xl border border-[#fab983]/20 text-center">
                  <div className="grid grid-cols-2 gap-4 mt-12">
                    <button
                      type="button"
                      onClick={() => handleDevQuickLogin('agent')}
                      className="h-14 bg-white text-[#845326] border border-[#fab983]/30 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-[#845326] hover:text-white transition-all flex items-center justify-center gap-3 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-lg">person</span>
                      Agent Login
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDevQuickLogin('admin')}
                      className="h-14 bg-white text-[#002045] border border-[#002045]/10 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-[#002045] hover:text-white transition-all flex items-center justify-center gap-3 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                      Admin Login
                    </button>
                  </div>
                  <p className="mt-4 text-[9px] font-bold text-[#845326]/60 uppercase tracking-widest text-center">Development Role Bypass</p>
                </div>
              )}
            </form>
          </div>
        </div>

        <footer className="px-12 py-10 border-t border-[#f2f4f6] flex flex-col lg:flex-row justify-between items-center gap-6">
           <p className="text-[9px] font-black text-[#c4c6cf] uppercase tracking-[0.2em]">
            Protocol · © 2024 HouseinMozambique
          </p>
          <div className="flex gap-10">
            <a href="#" className="text-[9px] font-black text-[#74777f] hover:text-[#002045] uppercase tracking-widest transition-colors">Privacy</a>
            <a href="#" className="text-[9px] font-black text-[#74777f] hover:text-[#002045] uppercase tracking-widest transition-colors">Terms</a>
            <a href="#" className="text-[9px] font-black text-[#74777f] hover:text-[#002045] uppercase tracking-widest transition-colors">Security</a>
          </div>
        </footer>
      </section>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#002045] text-white">Authenticating...</div>}>
      <AuthForm />
    </Suspense>
  );
}
