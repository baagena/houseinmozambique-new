'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/i18n/LanguageContext';

import { setAuth } from '@/lib/auth';

// Professional, agent-focused hero image
const BG_IMG = 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop';

const SPECIALIZATION_KEYS = [
  'luxury', 'expat', 'polana', 
  'investment', 'waterfront', 'retail',
  'commercial', 'rural', 'matola'
] as const;

const TITLE_KEYS = [
  'junior', 'senior', 'premier', 
  'investSpecialist', 'luxuryAdvisor', 'relocation'
] as const;


const IS_DEV = process.env.NODE_ENV === 'development';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();
  
  const REGISTRATION_STEPS = [
    {
      id: 1,
      title: lang === 'en' ? 'Getting Started' : 'Começar',
      description: t.auth.signupStep1Desc,
      icon: 'vignette'
    },
    {
      id: 2,
      title: lang === 'en' ? 'Professional Info' : 'Informação Profissional',
      description: t.auth.signupStep2Desc,
      icon: 'distance'
    },
    {
      id: 3,
      title: lang === 'en' ? 'Your Profile' : 'Seu Perfil',
      description: t.auth.signupStep3Desc,
      icon: 'edit_note'
    }
  ];

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Two self-service partitions: professional agents and private owners. Owners
  // skip the professional profile steps but get the same listing controls.
  const [accountType, setAccountType] = useState<'AGENT' | 'OWNER'>('AGENT');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    // Step 2 Professional
    title: 'Premier Agent',
    location: '',
    yearsExperience: 1,
    // Step 3 Narrative
    bio: '',
    specializations: [] as string[],
  });

  const [error, setError] = useState<string | null>(null);

  const redirect = searchParams.get('redirect') || '/';
  const plan = searchParams.get('plan');

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = tab === 'signin' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tab === 'signup' ? { ...formData, accountType } : formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const user = data.user;
      setAuth({
        isLoggedIn: true,
        userName: user.name,
        role: user.role === 'ADMIN' ? 'admin' : 'agent',
        selectedPlan: plan || null,
        isDevAutoLogin: false,
      });
      
      // Store the real ID in localStorage for data fetching
      if (typeof window !== 'undefined') {
        localStorage.setItem('userId', user.id);
      }
      
      // Admins always go to admin dashboard; agents respect the ?redirect= param
      if (user.role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else {
        // Build the full redirect URL, appending plan if present
        let destination = redirect && redirect !== '/' ? redirect : '/dashboard/agent';
        if (plan && !destination.includes('plan=')) {
          destination += destination.includes('?') ? `&plan=${plan}` : `?plan=${plan}`;
        }
        router.push(destination);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevQuickLogin = async (role: 'admin' | 'agent' = 'agent') => {
    setIsLoading(true);
    setError(null);
    try {
      const devEmail = role === 'admin' ? 'admin@houseinmoz.com' : 'agent-1@houseinmoz.com';
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: devEmail, password: 'password123' }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      const user = data.user;
      setAuth({
        isLoggedIn: true,
        userName: user.name,
        role: role,
        selectedPlan: plan || 'Premium',
        isDevAutoLogin: true,
      });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('userId', user.id);
      }

      if (role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        let destination = redirect && redirect !== '/' ? redirect : '/dashboard/agent';
        if (plan && !destination.includes('plan=')) {
          destination += destination.includes('?') ? `&plan=${plan}` : `?plan=${plan}`;
        }
        router.push(destination);
      }
    } catch (err: any) {
      setError("Dev Login failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  // Private owners have no professional profile to fill in, so their sign-up is shorter.
  const totalSteps = accountType === 'OWNER' ? 2 : 3;

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <main className="min-h-screen flex flex-col md:flex-row md:h-screen md:overflow-hidden">
      {/* Left: Professional Editorial Visual */}
      <section className="hidden md:flex md:w-5/12 lg:w-1/2 relative overflow-hidden bg-[#13233F] items-center p-12 lg:p-24 uppercase-off">
        <div className="absolute inset-0 z-0 scale-105">
          <Image src={BG_IMG} alt="Professional Agency Office" fill className="object-cover opacity-50 brightness-[0.7] mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#13233F] via-[#13233F]/40 to-transparent opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#13233F]/40 via-transparent to-transparent opacity-60" />
        </div>
        
        <div className="relative z-10 w-full max-w-xl">


          {tab === 'signin' ? (
            /* Sign In Left Side: Existing Branding */
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium text-white/90 tracking-wide">{t.auth.accessBadge}</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-semibold text-white leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--serif)' }}>
                {t.auth.signInHeroTitle}
              </h2>

              <p className="text-base lg:text-lg text-[#9fb4d6] leading-relaxed max-w-md">
                {t.auth.signInHeroDesc}
              </p>

              <footer className="pt-8 border-t border-white/10 flex items-center gap-6 mt-8">
                <div className="flex -space-x-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-lg border-2 border-[#13233F] bg-[#EDEAE2] flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-400" />
                    </div>
                  ))}
                </div>
                <div className="leading-tight">
                  <p className="text-white font-medium text-[13px]">Agency network</p>
                  <p className="text-[12px] text-[#9fb4d6]">280+ certified partners</p>
                </div>
              </footer>
            </div>
          ) : (
            /* Sign Up Left Side: Step-by-Step Registration Guide */
            <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A87A22]/20 backdrop-blur-xl border border-[#A87A22]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e9c877]" />
                  <span className="text-[11px] font-medium text-[#e9c877] tracking-wide">{t.auth.registrationBadge}</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-[1.1]" style={{ fontFamily: 'var(--serif)' }}>
                   {t.auth.registrationTitle}
                </h2>
              </div>

              <div className="relative space-y-3">
                {/* Connecting Line */}
                <div className="absolute left-[22px] top-8 bottom-8 w-px bg-white/10" />

                {REGISTRATION_STEPS.map((s) => {
                  const isActive = step === s.id;
                  const isCompleted = step > s.id;

                  return (
                    <div key={s.id} className={`relative flex gap-4 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                      {/* Step Indicator */}
                      <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 border ${isActive ? 'bg-[#A87A22] text-white border-[#e9c877]/30' : isCompleted ? 'bg-emerald-500/80 text-white border-emerald-400/30' : 'bg-white/5 text-white/50 border-white/10'}`}>
                        {isCompleted ? (
                          <span className="material-symbols-outlined text-[20px]">check</span>
                        ) : (
                          <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                        )}
                      </div>

                      {/* Step Content */}
                      <div className={`flex-1 px-4 py-3 rounded-xl transition-colors duration-300 ${isActive ? 'bg-white/5 backdrop-blur-xl border border-white/10' : ''}`}>
                        <h3 className="text-white font-medium text-[15px] tracking-tight mb-0.5 flex justify-between items-center">
                          {s.title}
                          {isActive && <span className="text-[11px] font-medium text-[#e9c877]">Current</span>}
                        </h3>
                        <p className={`text-[13px] leading-relaxed ${isActive ? 'text-[#9fb4d6]' : 'text-[#9fb4d6]/60'}`}>
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
        <header className="flex justify-between items-center px-8 lg:px-12 py-6">
          <Link href="/" className="md:hidden font-semibold text-[#13233F] text-xl tracking-tight [font-family:var(--serif)]">
             HIM.
          </Link>
          <nav className="flex gap-6 ml-auto items-center">
            <Link href="/" className="text-[13px] font-medium text-[#5E6B7A] hover:text-[#13233F] transition-colors">Home</Link>
            <Link href="/agents" className="text-[13px] font-medium text-[#5E6B7A] hover:text-[#13233F] transition-colors">Agents</Link>
          </nav>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-8 lg:px-20 py-10">
          <div className="w-full max-w-md">
            {/* Switcher */}
            <div className="flex gap-6 mb-9 border-b border-[#eceef1]">
              <button
                onClick={() => { setTab('signin'); setStep(1); }}
                className={`-mb-px pb-3 text-sm font-medium transition-colors relative ${tab === 'signin' ? 'text-[#13233F]' : 'text-[#9aa0a8] hover:text-[#5b616b]'}`}
              >
                {t.nav.signIn}
                {tab === 'signin' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#13233F]" />}
              </button>
              <button
                onClick={() => setTab('signup')}
                className={`-mb-px pb-3 text-sm font-medium transition-colors relative ${tab === 'signup' ? 'text-[#13233F]' : 'text-[#9aa0a8] hover:text-[#5b616b]'}`}
              >
                {lang === 'en' ? 'Create account' : 'Criar conta'}
                {tab === 'signup' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#13233F]" />}
              </button>
            </div>

            {/* Step Indicator (signup only) */}
            {tab === 'signup' && (
              <div className="flex items-center gap-2 mb-8">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${s <= step ? 'bg-[#13233F]' : 'bg-[#eceef1]'}`}
                  />
                ))}
                <span className="text-[12px] font-medium text-[#9aa0a8] ml-3">{lang === 'en' ? 'Step' : 'Passo'} {step} / {totalSteps}</span>
              </div>
            )}

            <div className="mb-7">
              <h2 className="text-2xl font-semibold text-[#13233F] mb-1.5 tracking-tight">
                {tab === 'signin' ? t.auth.welcomeBtn : step === 1 ? t.auth.getStarted : step === 2 ? t.auth.yourDetails : t.auth.aboutYou}
              </h2>
              <p className="text-sm text-[#5E6B7A] leading-relaxed">
                {tab === 'signin'
                  ? t.auth.loginDesc
                  : step === 1 ? t.auth.signupStep1Desc : step === 2 ? t.auth.signupStep2Desc : t.auth.signupStep3Desc}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {tab === 'signin' ? (
                /* Login Form */
                <>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="block text-[13px] font-medium text-[#5b616b]">{t.auth.emailLabel}</label>
                       <input
                        type="email"
                        required
                        className="w-full h-11 px-3.5 rounded-lg border border-[#e3e6ea] bg-white text-[14px] font-medium text-[#13233F] outline-none transition-colors focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10"
                        placeholder="agent@houseinmoz.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                       <div className="flex justify-between items-center">
                         <label className="block text-[13px] font-medium text-[#5b616b]">{t.auth.passwordLabel}</label>
                         <button type="button" className="text-[13px] font-medium text-[#A87A22] hover:underline">{t.auth.forgotPassword}</button>
                       </div>
                       <input
                        type="password"
                        required
                        className="w-full h-11 px-3.5 rounded-lg border border-[#e3e6ea] bg-white text-[14px] font-medium text-[#13233F] outline-none transition-colors focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAuth}
                    disabled={isLoading}
                    className="w-full h-11 bg-[#13233F] text-white text-[14px] font-medium rounded-lg transition-colors hover:bg-[#0a2f5c] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Signing in…' : t.auth.signInBtn}
                    {!isLoading && <span className="material-symbols-outlined text-[18px]">login</span>}
                  </button>
                </>
              ) : (
                /* Multi-step Registration */
                <>
                  {/* Step 1: Credentials */}
                  {step === 1 && (
                    <div className="space-y-4">
                      {/* Account partition: agents and private owners both get their
                          own secure workspace and manage only their own listings. */}
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-medium text-[#5b616b]">
                          {lang === 'en' ? 'I am registering as' : 'Estou a registar-me como'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            {
                              value: 'AGENT' as const,
                              icon: 'real_estate_agent',
                              label: lang === 'en' ? 'Real estate agent' : 'Agente imobiliário',
                              hint: lang === 'en' ? 'Agency or commissioner' : 'Agência ou comissário',
                            },
                            {
                              value: 'OWNER' as const,
                              icon: 'key',
                              label: lang === 'en' ? 'Private owner' : 'Proprietário privado',
                              hint: lang === 'en' ? 'Listing my own property' : 'Listar o meu imóvel',
                            },
                          ]).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => { setAccountType(option.value); setStep(1); }}
                              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                                accountType === option.value
                                  ? 'border-[#13233F] bg-[#13233F]/[0.04]'
                                  : 'border-[#e3e6ea] hover:bg-[#f5f6f8]'
                              }`}
                            >
                              <span className={`material-symbols-outlined text-[20px] ${accountType === option.value ? 'text-[#13233F]' : 'text-[#9aa0a8]'}`}>
                                {option.icon}
                              </span>
                              <span className="text-[13px] font-medium text-[#13233F] leading-tight">{option.label}</span>
                              <span className="text-[11px] text-[#9aa0a8] leading-tight">{option.hint}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                         <label className="block text-[13px] font-medium text-[#5b616b]">{t.auth.fullNameLabel}</label>
                         <input
                          type="text"
                          required
                          className="w-full h-11 px-3.5 rounded-lg border border-[#e3e6ea] bg-white text-[14px] font-medium text-[#13233F] outline-none transition-colors focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10"
                          placeholder="e.g. Ricardo Santos"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                         <label className="block text-[13px] font-medium text-[#5b616b]">{t.auth.emailLabel}</label>
                         <input
                          type="email"
                          required
                          className="w-full h-11 px-3.5 rounded-lg border border-[#e3e6ea] bg-white text-[14px] font-medium text-[#13233F] outline-none transition-colors focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10"
                          placeholder="ricardo@houseinmoz.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                         <label className="block text-[13px] font-medium text-[#5b616b]">{t.auth.createPassword}</label>
                         <input
                          type="password"
                          required
                          className="w-full h-11 px-3.5 rounded-lg border border-[#e3e6ea] bg-white text-[14px] font-medium text-[#13233F] outline-none transition-colors focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Professional Details */}
                  {step === 2 && (
                    <div className="space-y-4">
                      {accountType === 'AGENT' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[13px] font-medium text-[#5b616b]">{t.auth.profRoleLabel}</label>
                          <select
                            className="w-full h-11 px-3.5 rounded-lg border border-[#e3e6ea] bg-white text-[14px] font-medium text-[#13233F] outline-none transition-colors focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                          >
                            {TITLE_KEYS.map(k => <option key={k} value={k}>{(t.auth.titles as any)[k]}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[13px] font-medium text-[#5b616b]">{t.auth.expLabel}</label>
                          <input
                            type="number"
                            className="w-full h-11 px-3.5 rounded-lg border border-[#e3e6ea] bg-white text-[14px] font-medium text-[#13233F] tabular-nums outline-none transition-colors focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10"
                            value={formData.yearsExperience}
                            onChange={(e) => setFormData({...formData, yearsExperience: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      )}
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-medium text-[#5b616b]">{t.auth.locationLabel}</label>
                        <input
                          type="text"
                          required
                          className="w-full h-11 px-3.5 rounded-lg border border-[#e3e6ea] bg-white text-[14px] font-medium text-[#13233F] outline-none transition-colors focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10"
                          placeholder="e.g. Maputo City, Polana"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Narrative */}
                  {step === 3 && accountType === 'AGENT' && (
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-medium text-[#5b616b]">{t.auth.bioLabel}</label>
                        <textarea
                          rows={4}
                          className="w-full px-3.5 py-3 rounded-lg border border-[#e3e6ea] bg-white text-[14px] text-[#5E6B7A] outline-none transition-colors focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10 resize-none"
                          placeholder="Tell us a little about your experience and how you help clients…"
                          value={formData.bio}
                          onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[13px] font-medium text-[#5b616b]">{t.auth.expertiseLabel}</label>
                        <div className="flex flex-wrap gap-1.5">
                          {SPECIALIZATION_KEYS.map(k => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => toggleSpecialization(k)}
                              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${formData.specializations.includes(k) ? 'bg-[#13233F] text-white' : 'bg-[#f1f3f5] text-[#5b616b] hover:bg-[#E6E1D6]'}`}
                            >
                              {(t.auth.specializations as any)[k]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    {step > 1 && (
                      <button
                        onClick={prevStep}
                        className="flex-1 h-11 border border-[#e3e6ea] text-[#13233F] text-[14px] font-medium rounded-lg hover:bg-[#f5f6f8] transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        {t.auth.backBtn}
                      </button>
                    )}
                    {step < totalSteps ? (
                      <button
                        onClick={nextStep}
                        className="flex-[2] h-11 bg-[#13233F] text-white text-[14px] font-medium rounded-lg transition-colors hover:bg-[#0a2f5c] flex items-center justify-center gap-2"
                      >
                         {t.auth.saveAndContinue}
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleAuth}
                        disabled={isLoading}
                        className="flex-[2] h-11 bg-[#13233F] text-white text-[14px] font-medium rounded-lg transition-colors hover:bg-[#0a2f5c] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                         {isLoading ? 'Submitting…' : t.auth.completeRegistration}
                        {!isLoading && <span className="material-symbols-outlined text-[18px]">how_to_reg</span>}
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Social Integration */}
              <div className="relative py-2 flex items-center">
                <div className="flex-grow border-t border-[#eceef1]" />
                <span className="flex-shrink mx-3 text-[12px] font-medium text-[#9aa0a8]">or continue with</span>
                <div className="flex-grow border-t border-[#eceef1]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="flex items-center justify-center gap-2.5 h-11 border border-[#e3e6ea] rounded-lg hover:bg-[#f5f6f8] transition-colors">
                   <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[13px] font-medium text-[#13233F]">Google</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-2.5 h-11 border border-[#e3e6ea] rounded-lg hover:bg-[#f5f6f8] transition-colors">
                   <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" fill="#0077B5"/>
                  </svg>
                  <span className="text-[13px] font-medium text-[#13233F]">LinkedIn</span>
                </button>
              </div>

              {IS_DEV && (
                <div className="mt-2 rounded-lg border border-[#eceef1] bg-[#fafbfc] p-4">
                  <p className="mb-3 text-[11px] font-medium text-[#9aa0a8]">Development role bypass</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDevQuickLogin('agent')}
                      className="h-10 bg-white text-[#13233F] border border-[#e3e6ea] rounded-lg text-[13px] font-medium hover:bg-[#f5f6f8] transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      Agent login
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDevQuickLogin('admin')}
                      className="h-10 bg-white text-[#13233F] border border-[#e3e6ea] rounded-lg text-[13px] font-medium hover:bg-[#f5f6f8] transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                      Admin login
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <footer className="px-8 lg:px-12 py-6 border-t border-[#eceef1] flex flex-col lg:flex-row justify-between items-center gap-3">
           <p className="text-[12px] font-medium text-[#9aa0a8]">© 2024 House in Mozambique</p>
          <div className="flex gap-6">
            <a href="/privacy" className="text-[12px] font-medium text-[#5E6B7A] hover:text-[#13233F] transition-colors">Privacy</a>
            <a href="/terms" className="text-[12px] font-medium text-[#5E6B7A] hover:text-[#13233F] transition-colors">Terms</a>
          </div>
        </footer>
      </section>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#13233F] text-white">Authenticating...</div>}>
      <AuthForm />
    </Suspense>
  );
}
