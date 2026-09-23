'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/i18n/LanguageContext';

import { setAuth } from '@/lib/auth';
import Icon from '@/components/ui/Icon';

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  
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
  const [verificationMessage, setVerificationMessage] = useState('');

  const redirect = searchParams.get('redirect') || '/';
  const plan = searchParams.get('plan');
  const verified = searchParams.get('verified') === '1';

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    setVerificationMessage('');

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

      if (tab === 'signup' && data.requiresVerification) {
        setVerificationMessage(t.auth.accountCreatedVerification);
        setTab('signin');
        setStep(1);
        return;
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

  const resendVerification = async () => {
    if (!formData.email) {
      setError(t.auth.enterEmailFirst);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t.auth.cannotResendVerification);
      setVerificationMessage(t.auth.verificationSent);
    } catch (resendError: any) {
      setError(resendError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setError(t.auth.enterAccountEmail);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResetMessage('');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t.auth.cannotRequestReset);
      setResetMessage(data.message);
    } catch (resetError: any) {
      setError(resetError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevQuickLogin = async (role: 'admin' | 'agent' = 'agent') => {
    setIsLoading(true);
    setError(null);
    try {
      const devEmail = role === 'admin' ? 'princebagena@gmail.com' : 'agent-1@houseinmoz.com';
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

              <h2 className="text-4xl lg:text-5xl font-semibold !text-white leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--serif)' }}>
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
                          <Icon name="check" />
                        ) : (
                          <Icon name={s.icon} />
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
                <Icon name="error" size={18} />
                {error}
              </div>
            )}

            {verified && (
              <div className="mb-6 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-[13px] font-medium text-emerald-700">
                {t.auth.emailVerified}
              </div>
            )}

            {verificationMessage && (
              <div className="mb-6 rounded-lg border border-[#e9c877]/40 bg-[#fff9e8] p-4 text-[13px] text-[#705313]">
                <p>{verificationMessage}</p>
                <button type="button" onClick={resendVerification} disabled={isLoading} className="mt-2 font-semibold underline disabled:opacity-50">
                  {t.auth.resendVerification}
                </button>
              </div>
            )}

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {tab === 'signin' ? (
                /* Login Form */
                <>
                  {!showForgotPassword && <div className="space-y-4">
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
                         <button type="button" onClick={() => { setShowForgotPassword(true); setResetMessage(''); setError(null); }} className="text-[13px] font-medium text-[#A87A22] hover:underline">{t.auth.forgotPassword}</button>
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
                  </div>}
                  {showForgotPassword && (
                    <div className="space-y-4 rounded-lg border border-[#e3e6ea] bg-[#fafbfc] p-5">
                      <div>
                        <h3 className="text-lg font-semibold text-[#13233F]">{t.auth.resetPasswordTitle}</h3>
                        <p className="mt-1 text-[12px] text-[#5E6B7A]">{t.auth.resetPasswordDesc}</p>
                      </div>
                      <label className="block text-[12px] font-semibold text-[#5E6B7A]" htmlFor="forgot-password-email">
                        {t.auth.resetEmailLabel}
                      </label>
                      <input
                        id="forgot-password-email"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(event) => setForgotEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="mt-2 h-11 w-full rounded-lg border border-[#e3e6ea] bg-white px-3.5 text-[14px] text-[#13233F] outline-none focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10"
                      />
                      <button type="button" onClick={requestPasswordReset} disabled={isLoading} className="w-full rounded-lg bg-[#13233F] px-4 py-3 text-[13px] font-semibold text-white disabled:opacity-50">{isLoading ? t.auth.sending : t.auth.sendResetLink}</button>
                      {resetMessage && <p className="mt-2 text-[12px] text-emerald-600">{resetMessage}</p>}
                      <button type="button" onClick={() => { setShowForgotPassword(false); setResetMessage(''); setError(null); }} className="w-full text-center text-[13px] font-medium text-[#A87A22] hover:underline">{t.auth.backToSignIn}</button>
                    </div>
                  )}
                  {!showForgotPassword && <button
                    onClick={handleAuth}
                    disabled={isLoading}
                    className="w-full h-11 bg-[#13233F] text-white text-[14px] font-medium rounded-lg transition-colors hover:bg-[#0a2f5c] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? t.auth.signingIn : t.auth.signInBtn}
                    {!isLoading && <Icon name="login" size={18} />}
                  </button>}
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
                              <Icon name={option.icon} className={`${accountType === option.value ? 'text-[#13233F]' : 'text-[#9aa0a8]'}`} />
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
                        <Icon name="arrow_back" size={18} />
                        {t.auth.backBtn}
                      </button>
                    )}
                    {step < totalSteps ? (
                      <button
                        onClick={nextStep}
                        className="flex-[2] h-11 bg-[#13233F] text-white text-[14px] font-medium rounded-lg transition-colors hover:bg-[#0a2f5c] flex items-center justify-center gap-2"
                      >
                         {t.auth.saveAndContinue}
                        <Icon name="arrow_forward" size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={handleAuth}
                        disabled={isLoading}
                        className="flex-[2] h-11 bg-[#13233F] text-white text-[14px] font-medium rounded-lg transition-colors hover:bg-[#0a2f5c] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                         {isLoading ? 'Submitting…' : t.auth.completeRegistration}
                        {!isLoading && <Icon name="how_to_reg" size={18} />}
                      </button>
                    )}
                  </div>
                </>
              )}


              {IS_DEV && (
                <div className="mt-2 rounded-lg border border-[#eceef1] bg-[#fafbfc] p-4">
                  <p className="mb-3 text-[11px] font-medium text-[#9aa0a8]">{t.auth.devBypass}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDevQuickLogin('agent')}
                      className="h-10 bg-white text-[#13233F] border border-[#e3e6ea] rounded-lg text-[13px] font-medium hover:bg-[#f5f6f8] transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="person" size={18} />
                      {t.auth.agentLogin}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDevQuickLogin('admin')}
                      className="h-10 bg-white text-[#13233F] border border-[#e3e6ea] rounded-lg text-[13px] font-medium hover:bg-[#f5f6f8] transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="admin_panel_settings" size={18} />
                      {t.auth.adminLogin}
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
