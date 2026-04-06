'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

const BG_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDt0K1RBRHdLGXBytXaiibb_AvNPWggdjocBTHUownbbP7nNBNaZtkZHyn_GlMHgTZiB3Xa5WBMImmhuOkWu3P412UehZnDc4nE1q-uY6jAJMLU3Cp-8I-O8ej3g4puc4DYAJUYBZ1TjL3JoxZBdSLa8bJEELJCiFqpLADMxwYBVt5pmy1u43VRlIL5vT1E7ODjIroAVxT8bi8FDZwy6Fesk_WSHycBtrDT_0qsipVTfzMhfCvEfNGoJ_vSl46PeBRikyA4BtLAyQU';

const AVATARS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCiOXt2dRveVkrjSio-WyvA0T2dnueXsxIoEBmiDp1vKUG8p0fSUpn27LphVJMaJXX6S9bpsojkglnryV243Xh6uRGR_HPD0bybW8nDX-1oItz2l8XcPuZDQ4eEjtR8L0zJElaQHFR6ydy6MLc8rFdXXtDw5QBen2F4kyHbxD0NxPQJDSRTiIbgLH-27EWJi6IK83DnFScsZ8gtBqHGFs4hhzPhaJO0cKOjRlt0jJH1zGQUF7Mtbbu-F12p8doh26M2N0phZ6fQ4lo',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBTCEpZgETqvk1UCyti2aEoDOEQWr-la9EOo3UCHXHt9VLwGx08lI_qhKkIL3AHGijR6-ry5S-W1kr4OxSMc9xv2-qh400L1ESXkNkBARYMQ7e12LoD-T57jUpLMtqm3gy-KWxnmxxLdMR-kgTXfZ4R7u-hXPXHrKbsdh2KaPWa64c2ImneVNZUwu4lZpsEBId_ZZHIRPMl2d99noE7k_U_kC8QGHIFGI5tSboN5IhU6k4UZacXf9CuKRjIzwhZT3nP1cl0ynqAU64',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBww3j0XZSG3k3es5O3p1HvIxaaMPyllv62_gn_-FapvmQyzuEDLylUySICU3u3DkB8UuraeAPCB474UHP7UdM3L4xGyqeo3t53Ap4GmUQQr2U6PPxbvMi7nDvbsLsw8NSVsVk2UZPW_Be-W-BXg3kg5q6g8eE_pvWoGZszpPO9gPVfm-wBsG4nwRD73uUv0_MIyiFDSDoLbbLvnnpv1YaCoBhe76FDUnL69HNoJ7hHZ6nsPf1dGDDXARvWMMjkochu60npjBIpeKc',
];

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/';
  const plan = searchParams.get('plan');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock Authentication Logic
    setTimeout(() => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', formData.name || 'Premium Curator');
      if (plan) localStorage.setItem('selectedPlan', plan);
      
      router.push(redirect);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Editorial Visual */}
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden bg-[#002045] items-end p-12 lg:p-20">
        <div className="absolute inset-0 z-0">
          <Image src={BG_IMG} alt="Luxury Villa" fill className="object-cover opacity-60 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002045] via-transparent to-transparent opacity-90" />
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="mb-8 inline-block px-4 py-1 rounded-full bg-[#845326] text-white text-xs font-bold tracking-widest">
            CURATED EXCELLENCE
          </div>
          <h1
            className="text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tighter mb-6"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            HouseinMozambique
          </h1>
          <p className="text-[#86a0cd] text-lg lg:text-xl font-medium leading-relaxed mb-12">
            Experience the pinnacle of coastal living. From the vibrant streets of Maputo to the pristine shores of Bazaruto, find your architectural masterpiece.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-4">
              {AVATARS.map((src, i) => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-[#002045] overflow-hidden">
                  <Image src={src} alt={`Agent ${i + 1}`} width={48} height={48} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-[#86a0cd] font-medium text-sm">Joined by 2,000+ premium investors</span>
          </div>
        </div>

        {/* Floating Trust Score */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center p-4 shadow-xl border border-white/10 hidden lg:flex">
          <div className="text-center">
            <span className="block text-[#845326] font-extrabold text-2xl" style={{ fontFamily: 'var(--font-headline)' }}>4.9/5</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#002045]">Trust Score</span>
          </div>
        </div>
      </section>

      {/* Right: Form */}
      <section className="flex-1 flex flex-col bg-white">
        {/* Mobile header */}
        <header className="flex justify-between items-center px-8 py-8">
          <Link href="/" className="md:hidden font-extrabold text-[#002045] text-xl tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>
            HouseinMozambique
          </Link>
          <nav className="flex gap-6 ml-auto items-center">
            <Link href="/" className="text-sm font-semibold text-[#74777f] hover:text-[#002045] transition-colors">Home</Link>
            <a href="#" className="text-sm font-semibold text-[#74777f] hover:text-[#002045] transition-colors">Support</a>
          </nav>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Tabs */}
            <div className="bg-[#f2f4f6] p-1.5 rounded-xl flex mb-10">
              <button
                onClick={() => setTab('signin')}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${tab === 'signin' ? 'bg-white text-[#002045] shadow-sm' : 'text-[#74777f] hover:text-[#43474e]'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('signup')}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${tab === 'signup' ? 'bg-white text-[#002045] shadow-sm' : 'text-[#74777f] hover:text-[#43474e]'}`}
              >
                Create Account
              </button>
            </div>

            <div className="mb-8">
              <h2
                className="text-3xl font-extrabold text-[#191c1e] mb-3 tracking-tight"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {tab === 'signin' ? 'Welcome Back' : 'Join Our Network'}
              </h2>
              <p className="text-[#43474e] text-sm font-medium">
                {tab === 'signin'
                  ? 'Please enter your details to access your curator dashboard.'
                  : 'Create your account to start your property journey.'}
              </p>
              {plan && (
                <div className="mt-4 p-3 bg-[#845326]/10 rounded-lg border border-[#845326]/20 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#845326]">info</span>
                  <p className="text-xs font-bold text-[#845326]">You selected the <span className="uppercase">{plan}</span> plan.</p>
                </div>
              )}
            </div>

            <form className="space-y-6" onSubmit={handleAuth}>
              {/* Name (signup only) */}
              {tab === 'signup' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#191c1e] uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full h-14 px-5 rounded-xl bg-[#e0e3e5] border-none focus:outline-none focus:ring-2 focus:ring-[#002045]/20 text-[#191c1e] placeholder:text-[#74777f]/60 font-medium"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#191c1e] uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full h-14 px-5 rounded-xl bg-[#e0e3e5] border-none focus:outline-none focus:ring-2 focus:ring-[#002045]/20 text-[#191c1e] placeholder:text-[#74777f]/60 font-medium"
                  placeholder="curator@houseinmoz.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#191c1e] uppercase tracking-wider">Password</label>
                  {tab === 'signin' && (
                    <a href="#" className="text-xs font-bold text-[#845326] hover:underline">Forgot Password?</a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full h-14 px-5 rounded-xl bg-[#e0e3e5] border-none focus:outline-none focus:ring-2 focus:ring-[#002045]/20 text-[#191c1e] placeholder:text-[#74777f]/60 font-medium"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#74777f]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-[#002045] to-[#1a365d] text-white font-bold rounded-xl shadow-lg shadow-[#002045]/20 hover:scale-[1.01] transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="animate-pulse">Authenticating...</span>
                ) : (
                  <>
                    {tab === 'signin' ? 'Sign In to Account' : 'Create Account'}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative py-4 flex items-center">
                <div className="flex-grow border-t border-[#c4c6cf]/30" />
                <span className="flex-shrink mx-4 text-xs font-bold text-[#74777f] uppercase tracking-widest">or continue with</span>
                <div className="flex-grow border-t border-[#c4c6cf]/30" />
              </div>

              {/* Social */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 h-14 bg-white border border-[#c4c6cf]/40 rounded-xl hover:bg-[#f2f4f6] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm font-bold text-[#43474e]">Google</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 h-14 bg-white border border-[#c4c6cf]/40 rounded-xl hover:bg-[#f2f4f6] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" fill="#0077B5"/>
                  </svg>
                  <span className="text-sm font-bold text-[#43474e]">LinkedIn</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-[#c4c6cf]/20">
          <p className="text-[10px] font-bold text-[#74777f] uppercase tracking-[0.2em]">
            © 2024 HouseinMozambique. Premium Real Estate Curator.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-bold text-[#74777f] hover:text-[#845326] uppercase tracking-[0.2em] transition-colors">Privacy Policy</a>
            <a href="#" className="text-[10px] font-bold text-[#74777f] hover:text-[#845326] uppercase tracking-[0.2em] transition-colors">Terms of Service</a>
          </div>
        </footer>
      </section>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#002045] text-white">Loading Auth...</div>}>
      <AuthForm />
    </Suspense>
  );
}
