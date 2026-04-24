'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { initAuth } from '@/lib/auth';
import { createProperty, uploadSingleImage } from '@/actions/properties';
import Image from 'next/image';
import { useLanguage } from '@/components/i18n/LanguageContext';


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

const AMENITIES_KEYS = [
  'wifi', 'pool', 'security', 'parking',
  'ac', 'garden', 'gym', 'oceanView',
  'waterfront', 'bbq', 'solar', 'generator',
  'staff', 'beach', 'tennis', 'theater'
] as const;

const CITIES = ['Maputo', 'Beira', 'Nampula', 'Vilanculos', 'Inhambane', 'Pemba', 'Matola', 'Tete', 'Quelimane'];


function PostPropertyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const STEPS = [
    { id: 0, label: t.postProperty.identityLabel, icon: 'home_work', description: lang === 'en' ? 'Property baseline & narrative' : 'Descrição e base do imóvel' },
    { id: 1, label: t.home.locationLabel, icon: 'location_on', description: t.postProperty.precisionPlotting },
    { id: 2, label: t.postProperty.photographyLabel, icon: 'photo_library', description: t.postProperty.featuresLabel },
    { id: 3, label: t.pricing.heroBadge, icon: 'payments', description: t.postProperty.publishAsset },
  ];

  const PLAN_META: Record<string, { label: string; icon: string; color: string }> = {
    standard: { label: lang === 'en' ? 'Standard Plan' : 'Plano Standard', icon: 'home', color: '#43474e' },
    premium:  { label: lang === 'en' ? 'Premium Plan' : 'Plano Premium',  icon: 'stars', color: '#845326' },
  };

  const selectedPlan = searchParams.get('plan') || 'standard';
  const planMeta = PLAN_META[selectedPlan] || PLAN_META.standard;

  const [step, setStep] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
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
  const [uploadStatus, setUploadStatus] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    const auth = initAuth();
    if (!auth.isLoggedIn) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadStatus({ current: 0, total: images.length });

    try {
      const uploadedUrls: string[] = [];

      // Sequential Upload
      for (let i = 0; i < images.length; i++) {
        setUploadStatus({ current: i + 1, total: images.length });
        
        // Skip if already a URL (shouldn't happen here but good for safety)
        if (!images[i].startsWith('data:')) {
          uploadedUrls.push(images[i]);
          continue;
        }

        const uploadResult = await uploadSingleImage(images[i]);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || `Failed to upload image ${i + 1}`);
        }
        uploadedUrls.push(uploadResult.url!);
      }

      // Finalize Property Creation
      const result = await createProperty(form, uploadedUrls);
      
      if (result.success) {
        setSubmitted(true);
      } else {
        alert(result.error || 'Failed to publish asset. Please verify details.');
      }
    } catch (error: any) {
      console.error('Submission failed:', error);
      alert(`Publication error: ${error.message || 'The connection was lost. Please try with fewer or smaller images.'}`);
    } finally {
      setIsSubmitting(false);
      setUploadStatus(null);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          // Proactive Compression Logic
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1920; 

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Use JPEG quality 0.8 to significantly reduce file size
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setImages((prev) => [...prev, compressedBase64]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
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
            Your property has been submitted for review. Our team will review your listing within 24 hours and get back to you.
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

              {/* Selected Plan Badge */}
              <div className="mt-6 p-4 bg-[#002045] rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-xl">{planMeta.icon}</span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-0.5">{lang === 'en' ? 'Your Plan' : 'Seu Plano'}</p>
                  <p className="text-sm font-black text-white tracking-tight">{planMeta.label}</p>
                </div>
              </div>

              <div className="mt-6 p-5 bg-[#f7f9fb] rounded-2xl border border-[#c4c6cf]/10">
                <p className="text-[10px] font-bold text-[#002045] uppercase tracking-widest mb-2">{t.postProperty.needHelp}</p>
                <p className="text-[11px] text-[#43474e] leading-relaxed">
                  {t.postProperty.supportDesc} 
                  <a href="#" className="text-[#845326] font-bold block mt-1 hover:underline">{t.postProperty.contactSupport}</a>
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
                          {t.postProperty.identityLabel}
                        </label>
                      </div>
                      <input
                        type="text"
                        required
                        className="w-full h-16 px-6 rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-[#f2f4f6] focus:outline-none focus:ring-4 focus:ring-[#002045]/5 text-xl font-black text-[#191c1e] placeholder-[#c4c6cf] transition-all"
                        placeholder={t.postProperty.identityPlaceholder}
                        value={form.title}
                        onChange={(e) => update('title', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">Intention</label>
                        <div className="flex gap-2 bg-[#f2f4f6]/50 p-1.5 rounded-xl border border-[#f2f4f6]">
                          {['Buy', 'Rent', 'Short Stay', 'Auction'].map((t) => (
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
                        placeholder={t.postProperty.narrativePlaceholder}
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
                        <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">{t.postProperty.locationCityLabel}</label>
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
                        <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">{t.postProperty.neighborhoodLabel}</label>
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
                      <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">{t.postProperty.addressLabel}</label>
                      <input
                        type="text"
                        className="w-full h-14 px-6 rounded-xl bg-[#f2f4f6]/30 border border-none focus:outline-none focus:ring-4 focus:ring-[#002045]/5 text-sm font-medium text-[#43474e] placeholder-[#c4c6cf]"
                        placeholder={t.postProperty.addressPlaceholder}
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
                        <h4 className="text-xl font-black text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>{t.postProperty.precisionPlotting}</h4>
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
                          {t.postProperty.photographyLabel}
                        </label>
                      </div>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-4 border-dashed border-[#f2f4f6] rounded-2xl p-12 text-center hover:bg-[#002045]/[0.02] transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <div className="relative z-10">
                          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] text-[#002045] group-hover:-translate-y-2 transition-transform duration-700">
                            <span className="material-symbols-outlined text-5xl">upload_file</span>
                          </div>
                          <h3 className="text-3xl font-black text-[#002045] mb-3 tracking-tighter" style={{ fontFamily: 'var(--font-headline)' }}>{lang === 'en' ? 'Bring your asset to life' : 'Dê vida ao seu imóvel'}</h3>
                          <p className="text-sm text-[#74777f] max-w-sm mx-auto leading-relaxed font-medium">
                            Premium buyers expect <span className="text-[#845326] font-bold">4K Aerial and Architectural shots</span>. 
                            Min 12 high-res files recommended.
                          </p>
                          <div className="flex flex-wrap justify-center gap-4 mt-8">
                            {images.length > 0 ? (
                              images.map((img, i) => (
                                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-[#845326]/20">
                                  <Image src={img} alt="Preview" fill className="object-cover" />
                                </div>
                              ))
                            ) : (
                              <button type="button" className="px-10 py-4 bg-[#002045] text-white rounded-xl text-[10px] font-black tracking-widest uppercase hover:shadow-xl hover:scale-105 transition-all">
                                {t.postProperty.uploadMediaBtn}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                    <div className="flex items-center gap-3 pl-1">
                        <span className="material-symbols-outlined text-[#845326] text-xl">award_star</span>
                        <label className="block text-sm font-bold text-[#002045] uppercase tracking-[0.15em]" style={{ fontFamily: 'var(--font-headline)' }}>
                          {t.postProperty.featuresLabel}
                        </label>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {AMENITIES_KEYS.map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => toggleAmenity(k)}
                            className={`p-4 rounded-xl text-[9px] font-black tracking-wider uppercase text-left transition-all duration-300 border-2 flex items-center justify-between ${
                                form.amenities.includes(k)
                                  ? 'border-[#002045] bg-[#002045] text-white shadow-xl shadow-[#002045]/10 translate-y-[-1px]'
                                  : 'border-[#f2f4f6] bg-white text-[#43474e] hover:border-[#002045]/20'
                            }`}
                          >
                            <span>{(t.property.amenities as any)[k]}</span>
                            {form.amenities.includes(k) && <span className="material-symbols-outlined text-sm">verified</span>}
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
                        <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">{t.postProperty.valuationLabel}</label>
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
                        <label className="block text-[10px] font-extrabold text-[#74777f] uppercase tracking-[0.25em] pl-1">{t.postProperty.acquisitionLabel}</label>
                        <div className="relative group">
                          <select
                            className="w-full h-16 px-8 rounded-xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.02)] border border-[#f2f4f6] focus:outline-none focus:ring-4 focus:ring-[#002045]/5 text-lg font-black text-[#191c1e] appearance-none cursor-pointer transition-all"
                            value={form.priceUnit}
                            onChange={(e) => update('priceUnit', e.target.value)}
                          >
                            <option value="sale">{t.nav.buy}</option>
                            <option value="monthly">{t.nav.rent}</option>
                            <option value="nightly">{t.nav.shortStay}</option>
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
                          <h3 className="text-3xl font-black text-white tracking-widest uppercase mb-1" style={{ fontFamily: 'var(--font-headline)' }}>{t.postProperty.reviewPortfolio}</h3>
                          <p className="text-[#86a0cd] font-bold text-xs tracking-widest">DIGITAL TWIN ASSESSMENT · v1.0</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10">
                          <div className="w-3 h-3 bg-[#fab983] rounded-full animate-pulse" />
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Review Pending</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-14 gap-x-10 relative z-10">
                        {[
                          { label: t.postProperty.objectIdentity, value: form.title || t.postProperty.incomplete },
                          { label: t.postProperty.categoryStyle, value: `${form.listingType} ${t.postProperty.concept} · ${form.propertyType}` },
                          { label: t.postProperty.geoCoordinates, value: form.city ? `${form.neighborhood}, ${form.city}` : t.postProperty.targetNotSet },
                          { label: t.postProperty.dimensionalMetrics, value: `${form.bedrooms} BR · ${form.bathrooms} BA · ${form.area}m²` },
                          { label: t.postProperty.featuredAmenities, value: `${form.amenities.length} ${t.postProperty.verifiedSignatures}` },
                          { label: t.postProperty.expectedValuation, value: form.price ? `$ ${Number(form.price).toLocaleString()}` : t.postProperty.valuationMissing },
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
                        <p className="text-sm text-[#002045] font-black tracking-tight mb-1" style={{ fontFamily: 'var(--font-headline)' }}>{t.postProperty.complianceLabel}</p>
                        <p className="text-xs text-[#43474e] leading-relaxed max-w-lg">
                          {t.postProperty.complianceDesc}
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
                      {t.postProperty.previousStep}
                    </button>
                  ) : (
                    <Link href="/" className="px-6 text-[#74777f] font-black tracking-widest uppercase text-[10px] hover:text-[#002045] transition-all">
                      {t.postProperty.discardListing}
                    </Link>
                  )}

                  <div className="flex gap-4 w-full md:w-auto">
                    {step < STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setStep(step + 1)}
                        className="flex-1 md:flex-none group bg-[#002045] text-white px-10 py-4 rounded-xl font-black tracking-widest uppercase text-[10px] flex items-center justify-center gap-3 shadow-lg hover:bg-[#003061] hover:-translate-y-1 transition-all active:scale-95"
                      >
                        {t.postProperty.saveAndProceed}
                        <span className="material-symbols-outlined transition-transform group-hover:translate-x-2 text-xl">arrow_forward_ios</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex-1 md:flex-none group bg-[#845326] text-white px-10 py-4 rounded-xl font-black tracking-widest uppercase text-[10px] flex items-center justify-center gap-3 shadow-lg hover:bg-[#965f2c] hover:-translate-y-1 transition-all active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {uploadStatus ? `${lang === 'en' ? 'Syncing Image' : 'Sincronizando Imagem'} ${uploadStatus.current}/${uploadStatus.total}` : lang === 'en' ? 'Finalizing...' : 'Finalizando...'}
                            </span>
                            <span className="material-symbols-outlined text-xl animate-spin">sync</span>
                          </div>
                        ) : (
                          <>
                            {t.postProperty.publishAsset}
                            <span className="material-symbols-outlined text-xl animate-pulse">publish</span>
                          </>
                        )}
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

export default function PostPropertyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]"><div className="animate-pulse text-[#002045] font-bold">Loading...</div></div>}>
      <PostPropertyForm />
    </Suspense>
  );
}
