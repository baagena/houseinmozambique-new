'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PaymentForm from '@/components/dashboard/PaymentForm';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { createProperty, uploadSingleImage } from '@/actions/properties';

const planAmounts: Record<string, number> = {
  standard: 1500,
  premium: 3500,
  pro: 7500,
  boost: 2500,
};

const propertyTypes = ['House', 'Villa', 'Apartment', 'Penthouse', 'Land', 'Bungalow', 'Lodge'];
const amenities = [
  'WiFi',
  'Pool',
  'Security',
  'Parking',
  'Air Conditioning',
  'Garden',
  'Ocean View',
  'Solar Power',
  'Generator',
  'Staff Quarters',
  'Gym',
  'Private Beach',
];
const contactOptions = [
  { id: 'phone', label: 'Phone Call', icon: 'call' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
  { id: 'dashboard', label: 'Dashboard Inbox', icon: 'inbox' },
];

function PostPropertyContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [contactMethods, setContactMethods] = useState<string[]>(['dashboard']);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [listingType, setListingType] = useState('Buy');
  const [propertyType, setPropertyType] = useState('House');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [area, setArea] = useState('');
  const [price, setPrice] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [responseTime, setResponseTime] = useState('');
  const [formError, setFormError] = useState('');

  const editId = searchParams.get('edit');
  const planType = searchParams.get('plan') || 'standard';
  const amount = planAmounts[planType] || planAmounts.standard;

  const summary = useMemo(() => {
    return [
      { label: t.postProperty.intentionLabel, value: listingType },
      { label: t.postProperty.classificationLabel, value: propertyType },
      { label: t.postProperty.locationCityLabel, value: city || t.postProperty.targetNotSet },
      { label: t.postProperty.neighborhoodLabel, value: neighborhood || t.postProperty.targetNotSet },
      { label: t.postProperty.valuationLabel, value: price ? `MT ${Number(price).toLocaleString()}` : t.postProperty.valuationMissing },
      { label: t.postProperty.photographyLabel, value: `${photos.length} uploaded` },
      { label: 'Agent contact', value: contactMethods.map((method) => contactOptions.find((option) => option.id === method)?.label).filter(Boolean).join(', ') },
    ];
  }, [city, contactMethods, listingType, neighborhood, photos.length, price, propertyType, t]);

  const priceUnit = listingType === 'Rent' ? 'monthly' : listingType === 'Short Stay' ? 'nightly' : 'sale';

  const buildDescription = () => {
    const lines = [description.trim()];
    if (latitude.trim() && longitude.trim()) {
      lines.push(`Coordinates: ${latitude.trim()}, ${longitude.trim()}`);
    }

    const contactLines = [
      agentPhone.trim() ? `Agent phone: ${agentPhone.trim()}` : '',
      whatsappNumber.trim() ? `WhatsApp: ${whatsappNumber.trim()}` : '',
      contactEmail.trim() ? `Contact email: ${contactEmail.trim()}` : '',
      responseTime.trim() ? `Preferred response time: ${responseTime.trim()}` : '',
    ].filter(Boolean);

    if (contactLines.length > 0) {
      lines.push(contactLines.join('\n'));
    }

    return lines.filter(Boolean).join('\n\n');
  };

  const validateDetails = () => {
    const requiredFields = [
      { label: 'title', value: title },
      { label: 'description', value: description },
      { label: 'city', value: city },
      { label: 'price', value: price },
      { label: 'bedrooms', value: bedrooms },
      { label: 'bathrooms', value: bathrooms },
      { label: 'area', value: area },
    ];

    const missing = requiredFields.find((field) => !field.value.trim());
    if (missing) {
      return `Please enter the listing ${missing.label} before continuing.`;
    }

    const numericFields = [
      { label: 'price', value: Number(price) },
      { label: 'bedrooms', value: Number(bedrooms) },
      { label: 'bathrooms', value: Number(bathrooms) },
      { label: 'area', value: Number(area) },
    ];
    const invalidNumber = numericFields.find((field) => Number.isNaN(field.value) || field.value < 0);
    if (invalidNumber) {
      return `Please enter a valid ${invalidNumber.label}.`;
    }

    if ((latitude.trim() && Number.isNaN(Number(latitude))) || (longitude.trim() && Number.isNaN(Number(longitude)))) {
      return 'Please enter valid latitude and longitude values.';
    }

    return '';
  };

  const handleProceedToPayment = () => {
    const error = validateDetails();
    if (error) {
      setFormError(error);
      return;
    }

    setFormError('');
    setStep('payment');
  };

  const handlePaymentSuccess = async () => {
    setIsUploadingPhotos(true);
    setFormError('');

    try {
      const uploadedImages: string[] = [];

      for (const file of photoFiles) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Unable to read file as base64.'));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        const uploadResult = await uploadSingleImage(base64);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload property image.');
        }
        uploadedImages.push((uploadResult as { success: true; url: string }).url);
      }

      const result = await createProperty(
        {
          title: title.trim(),
          description: buildDescription(),
          city: city.trim(),
          neighborhood: neighborhood.trim() || null,
          address: address.trim() || null,
          price,
          priceUnit,
          propertyType,
          listingType,
          bedrooms,
          bathrooms,
          area,
          amenities: selectedAmenities,
        },
        uploadedImages
      );

      if (!result.success) {
        throw new Error(result.error || 'Payment was recorded, but the property could not be submitted for review.');
      }

      setStep('success');
    } catch (error: any) {
      setFormError(error?.message || 'Unable to upload images and submit the listing.');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((current) =>
      current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity]
    );
  };

  const toggleContact = (method: string) => {
    setContactMethods((current) =>
      current.includes(method) ? current.filter((item) => item !== method) : [...current, method]
    );
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotoFiles((current) => [...current, ...files].slice(0, 12));
    setPhotos((current) => [...current, ...files.map((file) => file.name)].slice(0, 12));
  };

  if (step === 'payment') {
    return (
      <main className="min-h-screen bg-[#f7f9fb] px-4 py-10 md:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-[#002045] shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t.postProperty.previousStep}
            </button>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#845326]">{planType}</span>
          </div>
          <PaymentForm planType={planType} amount={amount} onSuccess={handlePaymentSuccess} />
        </div>
      </main>
    );
  }

  if (step === 'success') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f9fb] px-4">
        <div className="max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-[#845326]">task_alt</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tighter text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
            {t.postProperty.publishAsset}
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#43474e]/70">
            Your listing submission was received. Our team will review it before publication.
          </p>
          <Link href="/dashboard/agent/listings" className="mt-8 inline-flex rounded-xl bg-[#002045] px-6 py-3 text-xs font-black uppercase tracking-widest text-[#febc85]">
            {t.auth.myListings}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] px-4 py-10 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#845326]">
              {editId ? 'Edit Listing' : t.nav.postHouse}
            </p>
            <h1 className="text-4xl font-extrabold tracking-tighter text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
              {t.postProperty.identityLabel}
            </h1>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#74777f]">{t.postProperty.identityLabel}</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-[#c4c6cf]/30 bg-[#f7f9fb] px-4 py-3 text-sm font-bold text-[#002045] outline-none focus:border-[#002045]/30"
                  placeholder={t.postProperty.identityPlaceholder}
                />
              </label>
              <FieldSelect label={t.postProperty.intentionLabel} value={listingType} onChange={setListingType} options={['Buy', 'Rent', 'Short Stay', 'Auction']} />
              <FieldSelect label={t.postProperty.classificationLabel} value={propertyType} onChange={setPropertyType} options={propertyTypes} />
              <FieldInput label={t.postProperty.bedsLabel} type="number" value={bedrooms} onChange={setBedrooms} placeholder="3" />
              <FieldInput label={t.postProperty.bathsLabel} type="number" value={bathrooms} onChange={setBathrooms} placeholder="2" />
              <FieldInput label={t.postProperty.areaLabel} type="number" value={area} onChange={setArea} placeholder="320" />
              <FieldInput label={t.postProperty.valuationLabel} type="number" value={price} onChange={setPrice} placeholder="450000" />
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#74777f]">{t.postProperty.narrativeLabel}</span>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-xl border border-[#c4c6cf]/30 bg-[#f7f9fb] px-4 py-3 text-sm font-bold text-[#002045] outline-none"
                  placeholder={t.postProperty.narrativePlaceholder}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-lg font-black text-[#002045]">{t.postProperty.locationCityLabel}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <FieldInput label={t.postProperty.locationCityLabel} value={city} onChange={setCity} placeholder="Maputo" />
              <FieldInput label={t.postProperty.neighborhoodLabel} value={neighborhood} onChange={setNeighborhood} placeholder="Sommerschield" />
              <FieldInput label={t.postProperty.addressLabel} value={address} onChange={setAddress} placeholder={t.postProperty.addressPlaceholder} className="md:col-span-2" />
              <FieldInput label="Latitude" value={latitude} onChange={setLatitude} placeholder="-25.9692" />
              <FieldInput label="Longitude" value={longitude} onChange={setLongitude} placeholder="32.5732" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#002045]">{t.postProperty.photographyLabel}</h2>
                <p className="mt-1 text-sm font-medium text-[#74777f]">{t.postProperty.photographyDesc}</p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#002045] px-5 py-3 text-xs font-black uppercase tracking-widest text-[#febc85]">
                <span className="material-symbols-outlined text-lg">upload</span>
                {t.postProperty.uploadMediaBtn}
                <input type="file" multiple accept="image/*,video/*" onChange={handlePhotoUpload} className="sr-only" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {photos.map((photo) => (
                <div key={photo} className="flex aspect-[4/3] items-end rounded-xl border border-[#c4c6cf]/30 bg-[#f2f4f6] p-3">
                  <p className="truncate text-[10px] font-black uppercase tracking-widest text-[#74777f]">{photo}</p>
                </div>
              ))}
              {Array.from({ length: Math.max(1, 4 - photos.length) }).map((_, index) => (
                <div key={index} className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-[#c4c6cf]/50 bg-[#f7f9fb]">
                  <span className="material-symbols-outlined text-[#c4c6cf]">add_photo_alternate</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-lg font-black text-[#002045]">{t.postProperty.featuresLabel}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {amenities.map((amenity) => (
                <label key={amenity} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#c4c6cf]/20 bg-[#f7f9fb] p-4">
                  <input type="checkbox" checked={selectedAmenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="h-5 w-5 accent-[#002045]" />
                  <span className="text-sm font-bold text-[#002045]">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-black text-[#002045]">Agent Contact Information</h2>
            <p className="mt-1 text-sm font-medium text-[#74777f]">
              Choose how buyers and renters can reach the agent: direct phone call, WhatsApp, or the dashboard message box.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FieldInput label="Agent phone number" value={agentPhone} onChange={setAgentPhone} placeholder="+258 84 000 0000" />
              <FieldInput label="WhatsApp number" value={whatsappNumber} onChange={setWhatsappNumber} placeholder="+258 87 000 0000" />
              <FieldInput label="Contact email" type="email" value={contactEmail} onChange={setContactEmail} placeholder="agent@example.com" />
              <FieldInput label="Preferred response time" value={responseTime} onChange={setResponseTime} placeholder="09:00 - 18:00" />
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {contactOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                    contactMethods.includes(option.id)
                      ? 'border-[#002045] bg-[#002045] text-white'
                      : 'border-[#c4c6cf]/20 bg-[#f7f9fb] text-[#002045]'
                  }`}
                >
                  <input type="checkbox" checked={contactMethods.includes(option.id)} onChange={() => toggleContact(option.id)} className="sr-only" />
                  <span className="material-symbols-outlined">{option.icon}</span>
                  <span className="text-xs font-black uppercase tracking-widest">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-[#c4c6cf]/30 bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-[#74777f]">
              {t.postProperty.discardListing}
            </Link>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              {formError && (
                <p className="max-w-md rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {formError}
                </p>
              )}
              <button
            type="button"
            onClick={handleProceedToPayment}
            className="inline-flex items-center justify-center rounded-xl bg-[#002045] px-6 py-3 text-xs font-black uppercase tracking-widest text-[#febc85]"
          >
            {t.postProperty.saveAndProceed}
          </button>
          {isUploadingPhotos && (
            <p className="mt-3 text-sm font-medium text-[#002045]">Uploading images, please wait...</p>
          )}
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl bg-[#002045] p-6 text-white shadow-sm lg:sticky lg:top-8">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-[#febc85]">{t.postProperty.reviewPortfolio}</p>
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.postProperty.objectIdentity}</p>
              <p className="mt-1 text-sm font-bold">{title || t.postProperty.concept}</p>
            </div>
            {summary.map((item) => (
              <div key={item.label} className="border-b border-white/10 pb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{item.label}</p>
                <p className="mt-1 text-sm font-bold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-[#febc85]">{t.postProperty.needHelp}</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-white/70">{t.postProperty.supportDesc}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function FieldInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#74777f]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#c4c6cf]/30 bg-[#f7f9fb] px-4 py-3 text-sm font-bold text-[#002045] outline-none focus:border-[#002045]/30"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#74777f]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#c4c6cf]/30 bg-[#f7f9fb] px-4 py-3 text-sm font-bold text-[#002045] outline-none"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export default function PostPropertyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f7f9fb]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#002045]/10 border-t-[#002045]" />
        </main>
      }
    >
      <PostPropertyContent />
    </Suspense>
  );
}
