'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PaymentForm from '@/components/dashboard/PaymentForm';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { createProperty, updateProperty, uploadSingleImage } from '@/actions/properties';

/**
 * Paid plans only. The Standard tier is advertised as free on /pricing, so it
 * must not be sent through the payment step — anything not listed here posts
 * without payment rather than blocking the listing.
 */
const planAmounts: Record<string, number> = {
  premium: 3500,
  pro: 7500,
  boost: 2500,
};

/** Longest edge, in pixels, of an uploaded photo after downscaling. */
const MAX_IMAGE_EDGE = 1600;
const IMAGE_QUALITY = 0.82;

/**
 * Phone photos run to 5-16 MB, and the raw base64 of one of those overflows the
 * server action body limit — which is why uploads used to die silently. Downscale
 * and re-encode in the browser so every upload is a few hundred KB.
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`"${file.name}" is not an image file.`));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('This browser could not process the image.'));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      try {
        resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
      } catch {
        reject(new Error(`"${file.name}" could not be processed. Try a different photo.`));
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`"${file.name}" could not be read as an image.`));
    };

    image.src = objectUrl;
  });
}

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
  // Photos are compressed as soon as they are picked, so what we hold here is
  // already an upload-sized data URL plus the original name for the thumbnail.
  const [photos, setPhotos] = useState<{ name: string; dataUrl: string }[]>([]);
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
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
  const amount = planAmounts[planType] ?? 0;

  // Editing an existing listing, posting on the free tier, and staff posting are
  // all free actions — none of them should be sent through the payment step.
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingListing, setIsLoadingListing] = useState(Boolean(editId));
  const requiresPayment = amount > 0 && !editId && !isAdmin;

  // Check the session up front rather than letting someone fill in the whole
  // form (and pay) only to be told at the very end that they are not signed in.
  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('unauthenticated'))))
      .then((data) => {
        if (cancelled) return;
        setIsAuthenticated(true);
        setIsAdmin(data.user?.role === 'ADMIN');
      })
      .catch(() => {
        if (!cancelled) setIsAuthenticated(false);
      })
      .finally(() => {
        if (!cancelled) setAuthChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Editing: pull the current values in so the form updates the listing instead
  // of silently creating a duplicate.
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;

    setIsLoadingListing(true);
    fetch(`/api/property/${editId}`, { credentials: 'include' })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || 'This listing could not be loaded.');
        return payload.property;
      })
      .then((property) => {
        if (cancelled || !property) return;
        setTitle(property.title ?? '');
        setDescription(property.description ?? '');
        setCity(property.city ?? '');
        setNeighborhood(property.neighborhood ?? '');
        setAddress(property.address ?? '');
        setBedrooms(String(property.bedrooms ?? ''));
        setBathrooms(String(property.bathrooms ?? ''));
        setArea(String(property.area ?? ''));
        setPrice(String(property.price ?? ''));
        setPropertyType(property.type ?? 'House');
        setListingType(property.listingType ?? 'Buy');
        setSelectedAmenities(property.amenities ?? []);
        setPhotos(
          (property.images ?? []).map((url: string, index: number) => ({
            name: `Existing photo ${index + 1}`,
            dataUrl: url,
          }))
        );
      })
      .catch((error: Error) => {
        if (!cancelled) setFormError(error.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingListing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editId]);

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

    // Free tier, staff, and edits go straight to publishing.
    if (!requiresPayment) {
      void submitListing();
      return;
    }

    setStep('payment');
  };

  /**
   * Uploads any new photos and then creates or updates the listing. Every
   * failure path sets `formError`, which both the details and payment steps
   * render — a submission must never fail silently.
   */
  const submitListing = async () => {
    setIsUploadingPhotos(true);
    setFormError('');

    try {
      const uploadedImages: string[] = [];
      const newPhotos = photos.filter((photo) => photo.dataUrl.startsWith('data:'));
      let uploaded = 0;

      for (const photo of photos) {
        // Photos already hosted (an existing listing being edited) are kept as-is.
        if (!photo.dataUrl.startsWith('data:')) {
          uploadedImages.push(photo.dataUrl);
          continue;
        }

        uploaded += 1;
        setUploadProgress(`Uploading photo ${uploaded} of ${newPhotos.length}…`);

        const uploadResult = await uploadSingleImage(photo.dataUrl);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || `"${photo.name}" could not be uploaded.`);
        }
        uploadedImages.push((uploadResult as { success: true; url: string }).url);
      }

      setUploadProgress(editId ? 'Saving your changes…' : 'Publishing your listing…');

      const formData = {
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
      };

      const result = editId
        ? await updateProperty(editId, formData, uploadedImages)
        : await createProperty(formData, uploadedImages);

      if (!result.success) {
        throw new Error(result.error || 'The listing could not be saved. Please try again.');
      }

      setStep('success');
    } catch (error: any) {
      const message =
        typeof error?.message === 'string' && error.message
          ? error.message
          : 'Something went wrong while saving the listing. Please try again.';
      setFormError(
        /body exceeded|payload|413|too large|ERR_CONNECTION/i.test(message)
          ? 'The photos were too large to send. Remove the largest ones and try again.'
          : message
      );
      // Drop back to the form so the error is visible and the entry is not lost.
      setStep('details');
    } finally {
      setIsUploadingPhotos(false);
      setUploadProgress('');
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    // Let the same file be picked again after a failure.
    event.target.value = '';
    if (files.length === 0) return;

    setIsPreparingPhotos(true);
    setFormError('');

    const prepared: { name: string; dataUrl: string }[] = [];
    const rejected: string[] = [];

    for (const file of files) {
      try {
        prepared.push({ name: file.name, dataUrl: await compressImage(file) });
      } catch (error: any) {
        rejected.push(error?.message || `"${file.name}" could not be added.`);
      }
    }

    setPhotos((current) => [...current, ...prepared].slice(0, 12));
    if (rejected.length > 0) setFormError(rejected.join(' '));
    setIsPreparingPhotos(false);
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, position) => position !== index));
  };

  if (step === 'payment') {
    return (
      <main className="min-h-screen bg-[#F5F2EC] px-4 py-10 md:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#13233F] shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t.postProperty.previousStep}
            </button>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A87A22]">{planType}</span>
          </div>

          {formError && (
            <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {formError}
            </p>
          )}

          {isUploadingPhotos && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#E6E1D6]/30 bg-white px-4 py-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#13233F]/20 border-t-[#13233F]" />
              <p className="text-sm font-bold text-[#13233F]">
                {uploadProgress || 'Publishing your listing…'}
              </p>
            </div>
          )}

          <PaymentForm planType={planType} amount={amount} onSuccess={submitListing} />
        </div>
      </main>
    );
  }

  if (step === 'success') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F2EC] px-4">
        <div className="max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-[#A87A22]">task_alt</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#13233F]" style={{ fontFamily: 'var(--serif)' }}>
            {t.postProperty.publishAsset}
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#5E6B7A]/70">
            {editId
              ? 'Your changes were saved.'
              : isAdmin
              ? 'The listing was published and is live on the site.'
              : 'Your listing submission was received. Our team will review it before publication.'}
          </p>
          <Link href="/dashboard/agent/listings" className="mt-8 inline-flex rounded-xl bg-[#13233F] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#e9c877]">
            {t.auth.myListings}
          </Link>
        </div>
      </main>
    );
  }

  // Posting writes against the signed-in account, so say so before any work is done.
  if (authChecked && !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F2EC] px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-[#A87A22]">lock</span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#13233F]" style={{ fontFamily: 'var(--serif)' }}>
            Sign in to post a property
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#5E6B7A]/70">
            Listings are attached to your account so you can edit, suspend, or remove them later.
          </p>
          <Link
            href={`/auth?redirect=/post-property${editId ? `%3Fedit=${editId}` : ''}`}
            className="mt-7 inline-flex rounded-xl bg-[#13233F] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#e9c877]"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F2EC] px-4 py-10 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          {isLoadingListing && (
            <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#13233F]/20 border-t-[#13233F]" />
              <p className="text-sm font-bold text-[#13233F]">Loading your listing…</p>
            </div>
          )}
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#A87A22]">
              {editId ? 'Edit Listing' : t.nav.postHouse}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-[#13233F]" style={{ fontFamily: 'var(--serif)' }}>
              {t.postProperty.identityLabel}
            </h1>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#5E6B7A]">{t.postProperty.identityLabel}</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-[#E6E1D6]/30 bg-[#F5F2EC] px-4 py-3 text-sm font-bold text-[#13233F] outline-none focus:border-[#13233F]/30"
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
                <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#5E6B7A]">{t.postProperty.narrativeLabel}</span>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-xl border border-[#E6E1D6]/30 bg-[#F5F2EC] px-4 py-3 text-sm font-bold text-[#13233F] outline-none"
                  placeholder={t.postProperty.narrativePlaceholder}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-lg font-semibold text-[#13233F]">{t.postProperty.locationCityLabel}</h2>
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
                <h2 className="text-lg font-semibold text-[#13233F]">{t.postProperty.photographyLabel}</h2>
                <p className="mt-1 text-sm font-medium text-[#5E6B7A]">{t.postProperty.photographyDesc}</p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#13233F] px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#e9c877]">
                <span className="material-symbols-outlined text-lg">upload</span>
                {isPreparingPhotos ? 'Preparing…' : t.postProperty.uploadMediaBtn}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isPreparingPhotos || isUploadingPhotos}
                  className="sr-only"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {photos.map((photo, index) => (
                <div
                  key={`${photo.name}-${index}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E6E1D6]/30 bg-[#EDEAE2]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.dataUrl} alt={photo.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    title="Remove photo"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
              {Array.from({ length: Math.max(1, 4 - photos.length) }).map((_, index) => (
                <div key={index} className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-[#E6E1D6]/50 bg-[#F5F2EC]">
                  <span className="material-symbols-outlined text-[#E6E1D6]">add_photo_alternate</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs font-medium text-[#5E6B7A]">
              Photos are resized in your browser before uploading, so large phone pictures work fine.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-lg font-semibold text-[#13233F]">{t.postProperty.featuresLabel}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {amenities.map((amenity) => (
                <label key={amenity} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E6E1D6]/20 bg-[#F5F2EC] p-4">
                  <input type="checkbox" checked={selectedAmenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="h-5 w-5 accent-[#13233F]" />
                  <span className="text-sm font-bold text-[#13233F]">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-semibold text-[#13233F]">Agent Contact Information</h2>
            <p className="mt-1 text-sm font-medium text-[#5E6B7A]">
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
                      ? 'border-[#13233F] bg-[#13233F] text-white'
                      : 'border-[#E6E1D6]/20 bg-[#F5F2EC] text-[#13233F]'
                  }`}
                >
                  <input type="checkbox" checked={contactMethods.includes(option.id)} onChange={() => toggleContact(option.id)} className="sr-only" />
                  <span className="material-symbols-outlined">{option.icon}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-[#E6E1D6]/30 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#5E6B7A]">
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
            disabled={isUploadingPhotos || isPreparingPhotos || isLoadingListing}
            className="inline-flex items-center justify-center rounded-xl bg-[#13233F] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#e9c877] disabled:opacity-60"
          >
            {isUploadingPhotos
              ? 'Working…'
              : editId
              ? 'Save changes'
              : requiresPayment
              ? t.postProperty.saveAndProceed
              : 'Publish listing'}
          </button>
          {(isUploadingPhotos || isPreparingPhotos) && (
            <p className="mt-3 text-sm font-medium text-[#13233F]">
              {isPreparingPhotos ? 'Preparing photos…' : uploadProgress || 'Uploading images, please wait...'}
            </p>
          )}
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl bg-[#13233F] p-6 text-white shadow-sm lg:sticky lg:top-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#e9c877]">{t.postProperty.reviewPortfolio}</p>
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{t.postProperty.objectIdentity}</p>
              <p className="mt-1 text-sm font-bold">{title || t.postProperty.concept}</p>
            </div>
            {summary.map((item) => (
              <div key={item.label} className="border-b border-white/10 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{item.label}</p>
                <p className="mt-1 text-sm font-bold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#e9c877]">{t.postProperty.needHelp}</p>
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
      <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#5E6B7A]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E6E1D6]/30 bg-[#F5F2EC] px-4 py-3 text-sm font-bold text-[#13233F] outline-none focus:border-[#13233F]/30"
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
      <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#5E6B7A]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#E6E1D6]/30 bg-[#F5F2EC] px-4 py-3 text-sm font-bold text-[#13233F] outline-none"
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
        <main className="flex min-h-screen items-center justify-center bg-[#F5F2EC]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#13233F]/10 border-t-[#13233F]" />
        </main>
      }
    >
      <PostPropertyContent />
    </Suspense>
  );
}
