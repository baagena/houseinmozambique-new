'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 1, name: 'Personal', icon: 'person' },
  { id: 2, name: 'Professional', icon: 'business_center' },
  { id: 3, name: 'Expertise', icon: 'stars' },
];

export default function AgentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    title: '',
    yearsExperience: '',
    address: '',
    bio: '',
    specializations: [] as string[],
    avatar: null as string | null,
  });

  const [specInput, setSpecInput] = useState('');

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const addSpecialization = () => {
    if (specInput.trim() && !formData.specializations.includes(specInput.trim())) {
      setFormData({ ...formData, specializations: [...formData.specializations, specInput.trim()] });
      setSpecInput('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData({ ...formData, specializations: formData.specializations.filter((s) => s !== spec) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }
    
    setIsLoading(true);
    // Mock Registration Logic
    setTimeout(() => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', formData.fullName);
      localStorage.setItem('userRole', 'agent');
      router.push('/agents');
      setIsLoading(false);
    }, 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-[#f7f9fb]">
      {/* Left: Branding & Visuals */}
      <section className="hidden lg:flex lg:w-2/5 relative overflow-hidden bg-[#002045] items-end p-20">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuApliVjyyP7V3JSXWkyUmWNm0NvNNaNRvsd05QEZGmJbD2-rgbKrTamqcBP-5jVVtr5DwqtZYW2X1-bJC2cxS6JKPnlu6NYwPMBz0z2EJVfcNFJ6wM38SQa0pdX94TFKtExtWQwnmj69Pzt_KzgUkkboWYLoD51clkFy-MATWkGPE25UA2vIi6XQrNru_7zyZ5-QqAIMg1mt2eEKDPgu7m-A0vpAlYAKceo2QNXQkRD6sHTg5Jf2Kn5a1XBVcOrVkJbtHM4HvcW-Gw" 
            alt="Luxury Property" 
            fill 
            className="object-cover opacity-50 mix-blend-overlay" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002045] via-[#002045]/40 to-transparent" />
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-block mb-12">
            <h1 className="text-3xl font-extrabold text-white tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>
              HouseinMozambique
            </h1>
          </Link>
          <div className="space-y-8">
            <div className="inline-block px-4 py-1.5 rounded-full bg-[#845326] text-white text-[10px] font-bold tracking-[0.2em] uppercase">
              Agent Partnership Program
            </div>
            <h2 className="text-5xl font-extrabold text-white leading-tight tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
              Elevate Your <br />
              <span className="text-[#fab983]">Real Estate Career.</span>
            </h2>
            <p className="text-[#86a0cd] text-lg font-medium leading-relaxed max-w-md">
              Join Mozambique&apos;s most exclusive digital property gallery. Connect with high-net-worth investors and showcase your premium portfolio to the world.
            </p>
            
            <div className="pt-8 flex items-center gap-12">
              <div>
                <div className="text-3xl font-extrabold text-white" style={{ fontFamily: 'var(--font-headline)' }}>2k+</div>
                <div className="text-xs font-bold text-[#86a0cd] uppercase tracking-widest mt-1">Investors</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <div className="text-3xl font-extrabold text-white" style={{ fontFamily: 'var(--font-headline)' }}>500+</div>
                <div className="text-xs font-bold text-[#86a0cd] uppercase tracking-widest mt-1">Exclusive Listings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right: Registration Form */}
      <section className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Progress Header */}
        <header className="px-8 py-10 flex border-b border-[#c4c6cf]/15 bg-white lg:bg-transparent sticky top-0 z-20 backdrop-blur-md">
          <div className="max-w-2xl w-full mx-auto flex items-center justify-between relative">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-2 z-10 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  step >= s.id ? 'bg-[#002045] text-white' : 'bg-[#e0e3e5] text-[#74777f]'
                }`}>
                  <span className="material-symbols-outlined text-xl">{s.icon}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  step === s.id ? 'text-[#002045]' : 'text-[#74777f]'
                }`}>
                  {s.name}
                </span>
              </div>
            ))}
            {/* Progress Line */}
            <div className="absolute top-5 left-0 w-full h-0.5 bg-[#e0e3e5] -z-0" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-[#002045] transition-all duration-500 -z-0" 
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 lg:p-20">
          <div className="w-full max-w-xl">
            <div className="mb-12">
              <h3 className="text-3xl font-extrabold text-[#191c1e] mb-3 tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
                {step === 1 && "Start Your Journey"}
                {step === 2 && "Professional Profile"}
                {step === 3 && "Showcase Your Expertise"}
              </h3>
              <p className="text-[#43474e] font-medium">
                {step === 1 && "Create your account to join our verified partner network."}
                {step === 2 && "Tell us about your experience and where you operate."}
                {step === 3 && "Last step to build your premium presence on the platform."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* STEP 1: Personal Details */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#002045] uppercase tracking-widest">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full h-14 px-6 rounded-2xl bg-white border border-[#c4c6cf]/30 focus:border-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all text-[#191c1e] placeholder-[#74777f]/40 font-medium"
                      placeholder="e.g. Ricardo Santos"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#002045] uppercase tracking-widest">Work Email</label>
                    <input
                      required
                      type="email"
                      className="w-full h-14 px-6 rounded-2xl bg-white border border-[#c4c6cf]/30 focus:border-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all text-[#191c1e] placeholder-[#74777f]/40 font-medium"
                      placeholder="ricardo@exclusive.co.mz"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#002045] uppercase tracking-widest">Secure Password</label>
                    <input
                      required
                      type="password"
                      className="w-full h-14 px-6 rounded-2xl bg-white border border-[#c4c6cf]/30 focus:border-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all text-[#191c1e] placeholder-[#74777f]/40 font-medium"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Professional Profile */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#002045] uppercase tracking-widest">Professional Title</label>
                      <input
                        required
                        type="text"
                        className="w-full h-14 px-6 rounded-2xl bg-white border border-[#c4c6cf]/30 focus:border-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all text-[#191c1e] placeholder-[#74777f]/40 font-medium"
                        placeholder="e.g. Senior Partner"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#002045] uppercase tracking-widest">Years Experience</label>
                      <input
                        required
                        type="number"
                        className="w-full h-14 px-6 rounded-2xl bg-white border border-[#c4c6cf]/30 focus:border-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all text-[#191c1e] placeholder-[#74777f]/40 font-medium"
                        placeholder="e.g. 8"
                        value={formData.yearsExperience}
                        onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#002045] uppercase tracking-widest">Office Location / Address</label>
                    <input
                      required
                      type="text"
                      className="w-full h-14 px-6 rounded-2xl bg-white border border-[#c4c6cf]/30 focus:border-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all text-[#191c1e] placeholder-[#74777f]/40 font-medium"
                      placeholder="e.g. Av. Mao Tse Tung, Polana Cimento, Maputo"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Expertise & Brand */}
              {step === 3 && (
                <div className="space-y-8">
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-[#e0e3e5] border-4 border-white shadow-xl relative">
                        {formData.avatar ? (
                          <Image src={formData.avatar} alt="Profile" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#74777f]">
                            <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#845326] text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-xl">upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#002045] uppercase tracking-widest">Profile Portrait or Agency Logo</p>
                      <p className="text-[#74777f] text-xs mt-1">High resolution JPG or PNG preferred.</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#002045] uppercase tracking-widest">Professional Bio / Description</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full p-6 rounded-2xl bg-white border border-[#c4c6cf]/30 focus:border-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all text-[#191c1e] placeholder-[#74777f]/40 font-medium resize-none"
                      placeholder="Describe your expertise, achievements, and unique approach to real estate..."
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    />
                  </div>

                  {/* Specializations */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#002045] uppercase tracking-widest">Specializations</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.specializations.map((spec) => (
                        <span key={spec} className="px-3 py-1.5 bg-[#845326]/10 text-[#845326] rounded-full text-xs font-bold flex items-center gap-2">
                          {spec}
                          <button type="button" onClick={() => removeSpecialization(spec)}>
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full h-14 px-6 rounded-2xl bg-white border border-[#c4c6cf]/30 focus:border-[#002045] focus:ring-4 focus:ring-[#002045]/5 transition-all text-[#191c1e] placeholder-[#74777f]/40 font-medium"
                        placeholder="e.g. Coastal Villas, Commercial Hubs"
                        value={specInput}
                        onChange={(e) => setSpecInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                      />
                      <button 
                        type="button" 
                        onClick={addSpecialization}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 bg-[#002045] text-white rounded-lg flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="pt-8 flex items-center gap-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 h-16 rounded-2xl border border-[#c4c6cf]/30 text-[#002045] font-bold hover:bg-[#e0e3e5] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-[2] h-16 rounded-2xl font-bold transition-all shadow-xl flex items-center justify-center gap-2 ${
                    isLoading 
                      ? 'bg-[#002045]/70 cursor-not-allowed text-white' 
                      : 'bg-[#002045] text-white hover:bg-[#1a365d] active:scale-95'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {step === 3 ? 'Complete Application' : 'Continue to Next Step'}
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <p className="mt-12 text-center text-[10px] font-bold text-[#74777f] uppercase tracking-widest leading-relaxed">
              By proceeding, you agree to HouseinMozambique&apos;s <br />
              <Link href="#" className="underline text-[#002045]">Terms of Professional Service</Link> and <Link href="#" className="underline text-[#002045]">Agent Guidelines</Link>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-12 py-8 bg-white border-t border-[#c4c6cf]/15 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-[#74777f] uppercase tracking-[0.2em]">
            © 2024 HouseinMozambique. Premium Agent Network.
          </p>
          <div className="flex gap-8">
            <Link href="/" className="text-[10px] font-bold text-[#002045] uppercase tracking-[0.2em] hover:text-[#845326] transition-colors">Home</Link>
            <Link href="/support" className="text-[10px] font-bold text-[#002045] uppercase tracking-[0.2em] hover:text-[#845326] transition-colors">Support</Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
