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
    <main className="min-h-screen flex flex-col md:flex-row bg-[#F5F2EC]">
      {/* Left: Branding & Visuals */}
      <section className="hidden lg:flex lg:w-2/5 relative overflow-hidden bg-[#13233F] items-end p-20">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuApliVjyyP7V3JSXWkyUmWNm0NvNNaNRvsd05QEZGmJbD2-rgbKrTamqcBP-5jVVtr5DwqtZYW2X1-bJC2cxS6JKPnlu6NYwPMBz0z2EJVfcNFJ6wM38SQa0pdX94TFKtExtWQwnmj69Pzt_KzgUkkboWYLoD51clkFy-MATWkGPE25UA2vIi6XQrNru_7zyZ5-QqAIMg1mt2eEKDPgu7m-A0vpAlYAKceo2QNXQkRD6sHTg5Jf2Kn5a1XBVcOrVkJbtHM4HvcW-Gw" 
            alt="Luxury Property" 
            fill 
            className="object-cover opacity-50 mix-blend-overlay" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#13233F] via-[#13233F]/40 to-transparent" />
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-block mb-10">
            <h1 className="text-2xl font-semibold text-white tracking-tight" style={{ fontFamily: 'var(--serif)' }}>
              House in Mozambique
            </h1>
          </Link>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A87A22]/20 border border-[#A87A22]/30 text-[#e9c877] text-[11px] font-medium tracking-wide">
              Agent partnership program
            </div>
            <h2 className="text-4xl lg:text-5xl font-semibold text-white leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--serif)' }}>
              Elevate your <br />
              <span className="text-[#e9c877]">real estate career.</span>
            </h2>
            <p className="text-[#9fb4d6] text-base lg:text-lg leading-relaxed max-w-md">
              Join Mozambique&apos;s most exclusive digital property gallery. Connect with high-net-worth investors and showcase your portfolio to the world.
            </p>

            <div className="pt-6 flex items-center gap-8">
              <div className="leading-tight">
                <div className="text-2xl font-semibold text-white tabular-nums" style={{ fontFamily: 'var(--serif)' }}>2k+</div>
                <div className="text-[12px] font-medium text-[#9fb4d6] mt-0.5">Investors</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="leading-tight">
                <div className="text-2xl font-semibold text-white tabular-nums" style={{ fontFamily: 'var(--serif)' }}>500+</div>
                <div className="text-[12px] font-medium text-[#9fb4d6] mt-0.5">Exclusive listings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right: Registration Form */}
      <section className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Progress Header */}
        <header className="px-8 py-6 flex border-b border-[#eceef1] bg-white/85 sticky top-0 z-20 backdrop-blur-md">
          <div className="max-w-xl w-full mx-auto flex items-center justify-between relative">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1.5 z-10 relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  step >= s.id ? 'bg-[#13233F] text-white' : 'bg-[#eceef1] text-[#9aa0a8]'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                </div>
                <span className={`text-[12px] font-medium ${
                  step === s.id ? 'text-[#13233F]' : 'text-[#9aa0a8]'
                }`}>
                  {s.name}
                </span>
              </div>
            ))}
            {/* Progress Line */}
            <div className="absolute top-[18px] left-0 w-full h-0.5 bg-[#eceef1] -z-0" />
            <div
              className="absolute top-[18px] left-0 h-0.5 bg-[#13233F] transition-all duration-300 -z-0"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <h3 className="text-2xl font-semibold text-[#13233F] mb-1.5 tracking-tight">
                {step === 1 && "Start your journey"}
                {step === 2 && "Professional profile"}
                {step === 3 && "Showcase your expertise"}
              </h3>
              <p className="text-sm text-[#5E6B7A] leading-relaxed">
                {step === 1 && "Create your account to join our verified partner network."}
                {step === 2 && "Tell us about your experience and where you operate."}
                {step === 3 && "Last step to build your presence on the platform."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: Personal Details */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#5b616b]">Full name</label>
                    <input
                      required
                      type="text"
                      className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#e3e6ea] focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10 transition-colors text-[14px] font-medium text-[#13233F] placeholder-[#b4b9c0] outline-none"
                      placeholder="e.g. Ricardo Santos"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#5b616b]">Work email</label>
                    <input
                      required
                      type="email"
                      className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#e3e6ea] focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10 transition-colors text-[14px] font-medium text-[#13233F] placeholder-[#b4b9c0] outline-none"
                      placeholder="ricardo@exclusive.co.mz"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#5b616b]">Password</label>
                    <input
                      required
                      type="password"
                      className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#e3e6ea] focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10 transition-colors text-[14px] font-medium text-[#13233F] placeholder-[#b4b9c0] outline-none"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Professional Profile */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#5b616b]">Professional title</label>
                      <input
                        required
                        type="text"
                        className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#e3e6ea] focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10 transition-colors text-[14px] font-medium text-[#13233F] placeholder-[#b4b9c0] outline-none"
                        placeholder="e.g. Senior Partner"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#5b616b]">Years experience</label>
                      <input
                        required
                        type="number"
                        className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#e3e6ea] focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10 transition-colors text-[14px] font-medium text-[#13233F] tabular-nums placeholder-[#b4b9c0] outline-none"
                        placeholder="e.g. 8"
                        value={formData.yearsExperience}
                        onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#5b616b]">Office location / address</label>
                    <input
                      required
                      type="text"
                      className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#e3e6ea] focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10 transition-colors text-[14px] font-medium text-[#13233F] placeholder-[#b4b9c0] outline-none"
                      placeholder="e.g. Av. Mao Tse Tung, Polana Cimento, Maputo"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Expertise & Brand */}
              {step === 3 && (
                <div className="space-y-5">
                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-[#f1f3f5] border border-[#e3e6ea] relative">
                        {formData.avatar ? (
                          <Image src={formData.avatar} alt="Profile" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#9aa0a8]">
                            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#13233F] text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-[#0a2f5c] transition-colors">
                        <span className="material-symbols-outlined text-[18px]">upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </div>
                    <p className="text-[12px] text-[#9aa0a8]">Profile portrait or agency logo · JPG or PNG</p>
                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#5b616b]">Professional bio</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-3.5 py-3 rounded-lg bg-white border border-[#e3e6ea] focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10 transition-colors text-[14px] text-[#5E6B7A] placeholder-[#b4b9c0] outline-none resize-none"
                      placeholder="Describe your expertise, achievements, and unique approach to real estate…"
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    />
                  </div>

                  {/* Specializations */}
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#5b616b]">Specializations</label>
                    {formData.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {formData.specializations.map((spec) => (
                          <span key={spec} className="px-2.5 py-1 bg-[#f1f3f5] text-[#5b616b] rounded-md text-[12px] font-medium flex items-center gap-1.5">
                            {spec}
                            <button type="button" onClick={() => removeSpecialization(spec)} className="text-[#9aa0a8] hover:text-red-500">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full h-11 pl-3.5 pr-12 rounded-lg bg-white border border-[#e3e6ea] focus:border-[#13233F]/30 focus:ring-2 focus:ring-[#13233F]/10 transition-colors text-[14px] font-medium text-[#13233F] placeholder-[#b4b9c0] outline-none"
                        placeholder="e.g. Coastal Villas, Commercial Hubs"
                        value={specInput}
                        onChange={(e) => setSpecInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                      />
                      <button
                        type="button"
                        onClick={addSpecialization}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 bg-[#13233F] text-white rounded-md flex items-center justify-center hover:bg-[#0a2f5c] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="pt-2 flex items-center gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 h-11 rounded-lg border border-[#e3e6ea] text-[#13233F] text-[14px] font-medium hover:bg-[#f5f6f8] transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] h-11 rounded-lg bg-[#13233F] text-white text-[14px] font-medium transition-colors hover:bg-[#0a2f5c] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      {step === 3 ? 'Complete application' : 'Continue'}
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-[12px] text-[#9aa0a8] leading-relaxed">
              By proceeding, you agree to our{' '}
              <Link href="#" className="underline text-[#5b616b] hover:text-[#13233F]">Terms of Service</Link> and{' '}
              <Link href="#" className="underline text-[#5b616b] hover:text-[#13233F]">Agent Guidelines</Link>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 lg:px-12 py-6 bg-white border-t border-[#eceef1] flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[12px] font-medium text-[#9aa0a8]">© 2024 House in Mozambique · Agent network</p>
          <div className="flex gap-6">
            <Link href="/" className="text-[12px] font-medium text-[#5E6B7A] hover:text-[#13233F] transition-colors">Home</Link>
            <Link href="/support" className="text-[12px] font-medium text-[#5E6B7A] hover:text-[#13233F] transition-colors">Support</Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
