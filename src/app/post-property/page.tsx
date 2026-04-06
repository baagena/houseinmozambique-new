'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 0, label: 'Property Details', icon: 'home_work', description: 'Basic info about your home' },
  { id: 1, label: 'Location', icon: 'location_on', description: 'Where is it situated?' },
  { id: 2, label: 'Media & Features', icon: 'photo_library', description: 'Photos and amenities' },
  { id: 3, label: 'Pricing & Review', icon: 'payments', description: 'Finalize and submit' },
];

interface FormData {
  // Step 1
  title: string;
  listingType: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  // Step 2
  city: string;
  neighborhood: string;
  address: string;
  // Step 3
  amenities: string[];
  // Step 4
  price: string;
  priceUnit: string;
}

const AMENITIES_LIST = [
  'WiFi / Internet', 'Swimming Pool', '24/7 Security', 'Parking',
  'Air Conditioning', 'Garden', 'Gym / Fitness Center', 'Ocean View',
  'Waterfront', 'BBQ Area', 'Solar Power', 'Backup Generator',
  'Household Staff', 'Private Beach', 'Tennis Court', 'Home Theater',
];

const CITIES = ['Maputo', 'Beira', 'Nampula', 'Vilanculos', 'Inhambane', 'Pemba', 'Matola', 'Tete', 'Quelimane'];

export default function PostPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [form, setForm] = useState<FormData>({
    title: '',
    listingType: 'Buy',
    propertyType: 'Villa',
    bedrooms: 3,
    bathrooms: 2,
    area: 0,
    description: '',
    city: '',
    neighborhood: '',
    address: '',
    amenities: [],
    price: '',
    priceUnit: 'sale',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/auth?redirect=/post-property');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(a: string) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <div className="animate-pulse text-[#002045] font-bold">Verifying authentication...</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <div className="text-center max-w-md px-6">
          <div className="w-24 h-24 bg-[#002045] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#002045]/20">
            <span className="material-symbols-outlined text-white text-4xl">check</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#002045] mb-4" style={{ fontFamily: 'var(--font-headline)' }}>
            Listing Submitted!
          </h1>
          <p className="text-[#43474e] mb-8 leading-relaxed">
            Your property has been submitted for review. Our curation team will review your listing within 24 hours and get back to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/" className="flex-1 bg-[#002045] text-white py-4 rounded-xl font-bold text-center hover:opacity-90 transition-opacity">
              Go to Home
            </Link>
            <Link href="/properties" className="flex-1 border-2 border-[#002045] text-[#002045] py-4 rounded-xl font-bold text-center hover:bg-[#002045]/5 transition-colors">
              Browse Properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-[#f7f9fb]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:items-start">
          
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-80 lg:sticky lg:top-28 order-2 lg:order-1">
            <div className="bg-white rounded-2xl p-6 shadow-[0_12px_40px_rgba(25,28,30,0.04)]">
              <h3 className="text-xs font-bold text-[#74777f] uppercase tracking-[0.2em] mb-6 border-b border-[#c4c6cf]/20 pb-3">
                Listing Progress
              </h3>
              <nav className="space-y-4">
                {STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => i < step && setStep(i)}
                    className={`w-full text-left group transition-all ${i > step ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${
                        i === step 
                          ? 'bg-[#002045] text-white shadow-lg shadow-[#002045]/20' 
                          : i < step 
                            ? 'bg-[#845326] text-white' 
                            : 'bg-[#f2f4f6] text-[#74777f]'
                      }`}>
                        {i < step ? (
                          <span className="material-symbols-outlined text-lg">check</span>
                        ) : (
                          <span className="material-symbols-outlined text-lg">{s.icon}</span>
                        )}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-sm font-bold tracking-tight mb-0.5 ${i === step ? 'text-[#002045]' : 'text-[#43474e]'}`}>
                          {s.label}
                        </p>
                        <p className="text-[10px] text-[#74777f] font-medium leading-tight">
                          {s.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </nav>

              <div className="mt-12 p-5 bg-[#f7f9fb] rounded-2xl border border-[#c4c6cf]/10">
                <p className="text-[10px] font-bold text-[#002045] uppercase tracking-widest mb-2">Need help?</p>
                <p className="text-[11px] text-[#43474e] leading-relaxed">
                  Our curation team is available 24/7 to help you with your listing. 
                  <a href="#" className="text-[#845326] font-bold block mt-1 hover:underline">Contact Support</a>
                </p>
              </div>
            </div>
          </aside>

          {/* Main Form Content */}
          <main className="flex-1 order-1 lg:order-2">
            <header className="mb-10 lg:pl-4">
              <h1 className="text-4xl font-extrabold text-[#002045] mb-2 tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>
                {STEPS[step].label}
              </h1>
              <p className="text-[#43474e] mt-1 font-medium">{STEPS[step].description}</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-[#fdfdfe] rounded-2xl p-8 md:p-12 shadow-[0_30px_80px_rgba(0,32,69,0.04)] border border-[#eef0f2]">
                
                {/* Step 0: Property Details */}
                {step === 0 && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#845326] text-xl">edit_note</span>
                        <label className="block text-[10px] font-black text-[#002045] uppercase tracking-[0.2em]" style={{ fontFamily: 'var(--font-headline)' }}>
                          The Property Identity
                        </label>
                      </div>
                      <input
                        type="text"
                        required
                        className="w-full h-16 px-6 rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-[#f2f4f6] focus:outline-none focus:ring-4 focus:ring-[#002045]/5 text-xl font-black text-[#191c1e] placeholder-[#c4c6cf] transition-all"
                        placeholder="e.g., The Glass House in Sommerschield"
                        value={form.title}
                        onChange={(e) => update('title', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">Intention</label>
                        <div className="flex gap-2 bg-[#f2f4f6]/50 p-1.5 rounded-xl border border-[#f2f4f6]">
                          {['Buy', 'Rent', 'Short Stay'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => update('listingType', t)}
                              className={`flex-1 py-3.5 rounded-lg text-[10px] font-black transition-all duration-300 ${
                                form.listingType === t
                                  ? 'bg-[#002045] text-white shadow-lg shadow-[#002045]/10'
                                  : 'text-[#43474e] hover:text-[#002045]'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-5">
                        <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">Classification</label>
                        <div className="relative group">
                          <select
                            className="w-full h-14 px-6 rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-[#f2f4f6] focus:outline-none focus:ring-4 focus:ring-[#002045]/5 text-sm font-bold text-[#191c1e] appearance-none cursor-pointer transition-all"
                            value={form.propertyType}
                            onChange={(e) => update('propertyType', e.target.value)}
                          >
                            {['Villa', 'Apartment', 'Studio', 'Penthouse', 'Land', 'Bungalow', 'Lodge', 'Commercial'].map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#74777f] group-hover:text-[#002045] transition-colors">
                            unfold_more
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                      {([
                        { label: 'Beds', key: 'bedrooms' as const, icon: 'bed' },
                        { label: 'Baths', key: 'bathrooms' as const, icon: 'bathtub' },
                        { label: 'Area (m²)', key: 'area' as const, icon: 'square_foot' },
                      ]).map(({ label, key, icon }) => (
                        <div key={key} className="space-y-4">
                          <div className="flex items-center gap-2 pl-1">
                            <span className="material-symbols-outlined text-xs text-[#74777f]">{icon}</span>
                            <label className="block text-[9px] font-extrabold text-[#74777f] uppercase tracking-[0.2em]">{label}</label>
                          </div>
                          <input
                            type="number"
                            required
                            className="w-full h-14 px-6 rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-[#f2f4f6] focus:outline-none focus:ring-4 focus:ring-[#002045]/5 text-lg font-black text-[#002045] transition-all"
                            value={form[key]}
                            onChange={(e) => update(key, Number(e.target.value) as never)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#845326] text-xl">auto_stories</span>
                        <label className="block text-sm font-bold text-[#002045] uppercase tracking-[0.15em]" style={{ fontFamily: 'var(--font-headline)' }}>
                          Editorial Narrative
                        </label>
                      </div>
                      <textarea
                        rows={6}
                        required
                        className="w-full px-6 py-6 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-[#f2f4f6] focus:outline-none focus:ring-4 focus:ring-[#002045]/5 text-sm font-medium text-[#43474e] resize-none placeholder-[#c4c6cf] transition-all leading-relaxed"
                        placeholder="Transport the reader to their future home. Describe the light, the mood, and the unique architectural details..."
                        value={form.description}
                        onChange={(e) => update('description', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Step 1: Location */}
                {step === 1 && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-5">
                        <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">City / Province</label>
                        <div className="relative group">
                          <select
                            required
                            className="w-full h-16 px-6 rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-[#f2f4f6] focus:outline-none focus:ring-4 focus:ring-[#002045]/5 text-lg font-black text-[#191c1e] appearance-none cursor-pointer transition-all"
                            value={form.city}
                            onChange={(e) => update('city', e.target.value)}
                          >
                            <option value="">Select enclave</option>
                            {CITIES.map((c) => <option key={c}>{c}</option>)}
                          </select>
                          <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#002045] group-hover:scale-110 transition-transform">
                            location_city
                          </span>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">Historic District / Neighborhood</label>
                        <input
                          type="text"
                          required
                          className="w-full h-16 px-6 rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-[#f2f4f6] focus:outline-none focus:ring-4 focus:ring-[#002045]/5 text-lg font-black text-[#191c1e] placeholder-[#c4c6cf] transition-all"
                          placeholder="e.g., Polana Cimento A"
                          value={form.neighborhood}
                          onChange={(e) => update('neighborhood', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-5">
                      <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">Full Legal Address</label>
                      <input
                        type="text"
                        className="w-full h-14 px-6 rounded-xl bg-[#f2f4f6]/30 border border-none focus:outline-none focus:ring-4 focus:ring-[#002045]/5 text-sm font-medium text-[#43474e] placeholder-[#c4c6cf]"
                        placeholder="Rua, Building, Floor..."
                        value={form.address}
                        onChange={(e) => update('address', e.target.value)}
                      />
                    </div>

                    <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-[#f2f4f6] border border-[#c4c6cf]/10 flex items-center justify-center group cursor-crosshair shadow-inner">
                      <div className="absolute inset-0 bg-[#002045]/5 backdrop-blur-[2px]" />
                      <div className="relative z-10 text-center transition-transform group-hover:scale-110 duration-700">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl text-[#002045] animate-bounce-slow">
                          <span className="material-symbols-outlined text-4xl">my_location</span>
                        </div>
                        <h4 className="text-xl font-black text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>Precision Plotting</h4>
                        <p className="text-[11px] text-[#43474e] mt-2 font-bold tracking-widest uppercase">Cartographic Engine Initializing</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Media & Features */}
                {step === 2 && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 pl-1">
                        <span className="material-symbols-outlined text-[#845326] text-xl">camera_outdoor</span>
                        <label className="block text-sm font-bold text-[#002045] uppercase tracking-[0.15em]" style={{ fontFamily: 'var(--font-headline)' }}>
                          Curated Photography
                        </label>
                      </div>
                      <div className="border-4 border-dashed border-[#f2f4f6] rounded-2xl p-12 text-center hover:bg-[#002045]/[0.02] transition-all cursor-pointer group relative overflow-hidden">
                        <div className="relative z-10">
                          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] text-[#002045] group-hover:-translate-y-2 transition-transform duration-700">
                            <span className="material-symbols-outlined text-5xl">upload_file</span>
                          </div>
                          <h3 className="text-3xl font-black text-[#002045] mb-3 tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>Bring your asset to life</h3>
                          <p className="text-sm text-[#74777f] max-w-sm mx-auto leading-relaxed font-medium">
                            Premium buyers expect <span className="text-[#845326] font-bold">4K Aerial and Architectural shots</span>. 
                            Min 12 high-res files recommended.
                          </p>
                          <button type="button" className="mt-8 px-10 py-4 bg-[#002045] text-white rounded-xl text-[10px] font-black tracking-widest uppercase hover:shadow-xl hover:scale-105 transition-all">
                            Open Media Vault
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                    <div className="flex items-center gap-3 pl-1">
                        <span className="material-symbols-outlined text-[#845326] text-xl">award_star</span>
                        <label className="block text-sm font-bold text-[#002045] uppercase tracking-[0.15em]" style={{ fontFamily: 'var(--font-headline)' }}>
                          Signature Features
                        </label>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {AMENITIES_LIST.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => toggleAmenity(a)}
                            className={`p-4 rounded-xl text-[9px] font-black tracking-wider uppercase text-left transition-all duration-300 border-2 flex items-center justify-between ${
                                form.amenities.includes(a)
                                  ? 'border-[#002045] bg-[#002045] text-white shadow-xl shadow-[#002045]/10 translate-y-[-1px]'
                                  : 'border-[#f2f4f6] bg-white text-[#43474e] hover:border-[#002045]/20'
                            }`}
                          >
                            <span>{a}</span>
                            {form.amenities.includes(a) && <span className="material-symbols-outlined text-sm">verified</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Pricing & Review */}
                {step === 3 && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-5">
                        <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">Market Valuation (USD)</label>
                        <div className="relative">
                          <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-2xl text-[#c4c6cf]">$</span>
                          <input
                            type="number"
                            required
                            className="w-full h-24 pl-14 pr-8 rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-[#f2f4f6] focus:outline-none focus:ring-8 focus:ring-[#002045]/5 text-4xl font-black text-[#002045] transition-all"
                            placeholder="0.00"
                            value={form.price}
                            onChange={(e) => update('price', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-5">
                        <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">Acquisition Model</label>
                        <div className="relative group">
                          <select
                            className="w-full h-16 px-8 rounded-xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.02)] border border-[#f2f4f6] focus:outline-none focus:ring-4 focus:ring-[#002045]/5 text-lg font-black text-[#191c1e] appearance-none cursor-pointer transition-all"
                            value={form.priceUnit}
                            onChange={(e) => update('priceUnit', e.target.value)}
                          >
                            <option value="sale">Full Asset Ownership</option>
                            <option value="monthly">Monthly Retainer</option>
                            <option value="nightly">Nocturnal Rate</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-[#845326] text-3xl opacity-40 group-hover:opacity-100 transition-opacity">
                            account_balance_wallet
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#002045] rounded-2xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/10 pb-10">
                        <div>
                          <h3 className="text-3xl font-black text-white tracking-widest uppercase mb-1" style={{ fontFamily: 'var(--font-headline)' }}>Review Portfolio</h3>
                          <p className="text-[#86a0cd] font-bold text-xs tracking-widest">DIGITAL TWIN ASSESSMENT · v1.0</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10">
                          <div className="w-3 h-3 bg-[#fab983] rounded-full animate-pulse" />
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Curation Pending</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-14 gap-x-10 relative z-10">
                        {[
                          { label: 'Object Identity', value: form.title || 'Incomplete' },
                          { label: 'Category Style', value: `${form.listingType} Concept · ${form.propertyType}` },
                          { label: 'Geo-Coordinates', value: form.city ? `${form.neighborhood}, ${form.city}` : 'Target not set' },
                          { label: 'Dimensional Metrics', value: `${form.bedrooms} BR · ${form.bathrooms} BA · ${form.area}m²` },
                          { label: 'Featured Amenities', value: `${form.amenities.length} Verified Signatures` },
                          { label: 'Expected Valuation', value: form.price ? `$ ${Number(form.price).toLocaleString()}` : 'Valuation missing' },
                        ].map(({ label, value }) => (
                          <div key={label} className="space-y-2 border-l border-white/20 pl-6">
                            <span className="text-[9px] font-black text-[#86a0cd] uppercase tracking-[0.25em]">{label}</span>
                            <span className="block font-black text-white text-lg leading-tight uppercase tracking-tight">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#845326]/5 rounded-3xl p-10 flex gap-6 items-center border border-[#845326]/10 relative">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center flex-shrink-0 text-[#845326]">
                        <span className="material-symbols-outlined text-3xl">verified_user</span>
                      </div>
                      <div>
                        <p className="text-sm text-[#002045] font-black tracking-tight mb-1" style={{ fontFamily: 'var(--font-headline)' }}>Editorial Compliance</p>
                        <p className="text-xs text-[#43474e] leading-relaxed max-w-lg">
                          By confirming, you acknowledge that this listing adheres to the <span className="font-black text-[#845326] underline underline-offset-4">Elite Standards Code</span>. Our curators will finalize the narrative aesthetic before publication.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Action Bar within Form Column */}
              <div className="sticky bottom-6 mt-12 bg-white/90 backdrop-blur-md border border-[#eef0f2] rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,32,69,0.06)] z-30">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="group flex items-center gap-3 px-6 text-[#002045] font-black tracking-widest uppercase text-[10px] hover:text-[#845326] transition-all"
                    >
                      <span className="material-symbols-outlined transition-transform group-hover:-translate-x-2 text-xl">arrow_back_ios</span>
                      Previous Step
                    </button>
                  ) : (
                    <Link href="/" className="px-6 text-[#74777f] font-black tracking-widest uppercase text-[10px] hover:text-[#002045] transition-all">
                      Discard Listing
                    </Link>
                  )}

                  <div className="flex gap-4 w-full md:w-auto">
                    {step < STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setStep(step + 1)}
                        className="flex-1 md:flex-none group bg-[#002045] text-white px-10 py-4 rounded-xl font-black tracking-widest uppercase text-[10px] flex items-center justify-center gap-3 shadow-lg hover:bg-[#003061] hover:-translate-y-1 transition-all active:scale-95"
                      >
                        Save & Proceed
                        <span className="material-symbols-outlined transition-transform group-hover:translate-x-2 text-xl">arrow_forward_ios</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="flex-1 md:flex-none group bg-[#845326] text-white px-10 py-4 rounded-xl font-black tracking-widest uppercase text-[10px] flex items-center justify-center gap-3 shadow-lg hover:bg-[#965f2c] hover:-translate-y-1 transition-all active:scale-95"
                      >
                        Publish Asset
                        <span className="material-symbols-outlined animate-pulse text-xl">publish</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
