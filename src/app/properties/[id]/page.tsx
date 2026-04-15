import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPropertyById, getProperties } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import PropertyGallery from '@/components/properties/PropertyGallery';

const MAP_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB-ewn_dW9IjG1C7aLrbTsDUYNQX7_yv2o_9_7cCUqKV0NtaQTy4CIc71q914J-38YtE3hSvbxES6NSU300Au6dR8M98kGKcrn_G5inEMYPi6jJ7bFecchy8RSWP6GfPv0_t_dDW4QWf8CLUhs7jA0cw9xnGCTgobbkFoq3Q1z8RRVKpiqN1ET1M10aW3XbTEfUoU_v4NAJAGLdmww1M1BS9nk6J8_fPhQ_ekYGwsoQv9vdo2yRFs8219hM55IY8kiT63SE87rjVNQ';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const properties = await getProperties();
  return properties.map((p) => ({ id: p.id }));
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  const agent = property.host;
  const priceLabel = property.priceUnit === 'monthly' ? 'month' : property.priceUnit === 'nightly' ? 'night' : null;
  
  const allProperties = await getProperties();
  const similar = allProperties.filter((p) => p.id !== property.id && p.listingType === property.listingType).slice(0, 3);

  return (
    <div className="pt-24 bg-[#f7f9fb]">
      <main className="max-w-7xl mx-auto px-4 md:px-8">

        {/* ── Dynamic Hero Gallery ── */}
        <PropertyGallery
          images={property.images}
          title={property.title}
          isSuperhost={property.isSuperhost || false}
          isRareFind={property.isRareFind || false}
          isNew={property.isNew || false}
          isPremium={property.isPremium || false}
        />

        {/* ── Main Content ── */}
        <div className="flex flex-col lg:flex-row gap-16 pb-24">
          {/* Left: Details */}
          <div className="flex-1">
            {/* Title */}
            <div className="mb-10">
              <div className="flex flex-wrap gap-2 mb-4">
                {property.isSuperhost && (
                  <span className="bg-[#febc85]/30 text-[#845326] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                    Superhost
                  </span>
                )}
                {property.isRareFind && (
                  <span className="bg-[#ffdad3] text-[#3e0500] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                    Rare Find
                  </span>
                )}
                {property.isNew && (
                  <span className="bg-[#002045] text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                    New Listing
                  </span>
                )}
              </div>
              <h1
                className="text-4xl font-extrabold text-[#002045] tracking-tight mb-2"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {property.title}
              </h1>
              <div className="flex items-center text-[#43474e] gap-1 mb-8">
                <span className="material-symbols-outlined text-xl">location_on</span>
                <span className="font-medium underline decoration-[#c4c6cf] underline-offset-4 cursor-pointer">
                  {property.location}
                </span>
              </div>

              {/* Key Highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 bg-[#f2f4f6] rounded-xl px-6">
                <div className="flex flex-col gap-1">
                  <span className="material-symbols-outlined text-[#002045] mb-2">bed</span>
                  <span className="font-bold text-[#002045]">{property.bedrooms} Bedrooms</span>
                  <span className="text-xs text-[#43474e]">King & Queen sizes</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="material-symbols-outlined text-[#002045] mb-2">bathtub</span>
                  <span className="font-bold text-[#002045]">{property.bathrooms} Bathrooms</span>
                  <span className="text-xs text-[#43474e]">En-suite luxury</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="material-symbols-outlined text-[#002045] mb-2">square_foot</span>
                  <span className="font-bold text-[#002045]">{property.area} m²</span>
                  <span className="text-xs text-[#43474e]">Living space</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="material-symbols-outlined text-[#002045] mb-2">pool</span>
                  <span className="font-bold text-[#002045]">{property.amenities.includes('Infinity Pool') || property.amenities.includes('Swimming Pool') ? 'Pool' : 'Garden'}</span>
                  <span className="text-xs text-[#43474e]">Private amenity</span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-[#002045] mb-6" style={{ fontFamily: 'var(--font-headline)' }}>
                About this home
              </h2>
              <div className="text-[#43474e] leading-relaxed space-y-4 whitespace-pre-line">
                {property.description}
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-[#002045] mb-8" style={{ fontFamily: 'var(--font-headline)' }}>
                What this place offers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {property.amenities.slice(0, 6).map((a) => (
                  <div key={a} className="flex items-center gap-4 text-[#191c1e]">
                    <span className="material-symbols-outlined text-[#845326]">check_circle</span>
                    <span className="font-medium">{a}</span>
                  </div>
                ))}
              </div>
              {property.amenities.length > 6 && (
                <button className="mt-10 bg-[#f7f9fb] text-[#002045] border border-[#74777f] px-8 py-3 rounded-lg font-bold hover:bg-[#f2f4f6] transition-all">
                  Show all {property.amenities.length} amenities
                </button>
              )}
            </div>

            {/* Host */}
            {agent && (
              <div className="mb-16 pt-16 border-t border-[#c4c6cf]/20">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 relative">
                      {agent.avatar ? (
                        <Image src={agent.avatar} alt={agent.name} fill className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#e6e8ea] flex items-center justify-center text-[#002045] font-bold text-lg">
                          {agent.initials}
                        </div>
                      )}
                    </div>
                    {agent.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-[#845326] text-white p-1 rounded-full border-2 border-[#f7f9fb]">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
                      Meet your host, {agent.name}
                    </h2>
                    <p className="text-[#43474e] mb-4">{agent.title}</p>
                    <div className="flex gap-4 mb-6">
                      <div className="flex items-center gap-1 bg-[#eceef0] text-xs font-bold px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-[14px]">star</span>
                        {agent.rating} Rating
                      </div>
                    </div>
                    <Link
                      href="/agents"
                      className="bg-[#002045] text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
                    >
                      Contact Curator
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Card */}
          <div className="w-full lg:w-[400px]">
            <div className="sticky top-28 bg-white p-8 rounded-xl shadow-[0_12px_32px_rgba(25,28,30,0.06)] ring-1 ring-[#c4c6cf]/10">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-3xl font-extrabold text-[#002045]">{formatPrice(property.price, property.priceUnit)}</span>
                </div>
                {property.rating && (
                  <div className="flex items-center gap-1 text-sm font-bold text-[#845326]">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span>{property.rating}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-[#f2f4f6] p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-[#e6e8ea] transition-colors">
                  <div>
                    <div className="text-[10px] font-extrabold text-[#845326] uppercase tracking-wider mb-1">Duration</div>
                    <div className="text-sm font-bold">
                      {property.listingType === 'Rent' ? 'Long Term (12 mo+)' :
                       property.listingType === 'Short Stay' ? 'Flexible Dates' : 'Purchase'}
                    </div>
                  </div>
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
                <div className="bg-[#f2f4f6] p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-[#e6e8ea] transition-colors">
                  <div>
                    <div className="text-[10px] font-extrabold text-[#845326] uppercase tracking-wider mb-1">Guests</div>
                    <div className="text-sm font-bold">Up to {property.bedrooms * 2} guests</div>
                  </div>
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-[#002045] text-white py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-all">
                  Contact Agent
                </button>
                <button className="w-full border-2 border-[#845326] text-[#845326] py-4 rounded-lg font-bold text-lg hover:bg-[#845326]/5 transition-all">
                  Book a Viewing
                </button>
              </div>
              <p className="text-center text-xs text-[#43474e] mt-6">You won&apos;t be charged yet. Inquiries are free.</p>
            </div>
          </div>
        </div>

        {/* ── Map ── */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-[#002045] mb-8" style={{ fontFamily: 'var(--font-headline)' }}>
            Where you&apos;ll be
          </h2>
          <div className="w-full h-[450px] rounded-xl overflow-hidden bg-[#e6e8ea] relative">
            <Image src={MAP_IMG} alt="Map" fill className="object-cover opacity-50 mix-blend-multiply" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-[#002045] p-4 rounded-full shadow-2xl relative">
                <span className="material-symbols-outlined text-white text-3xl">home</span>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#002045] rotate-45" />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="font-bold text-lg mb-2">{property.location}</h3>
            <p className="text-[#43474e] leading-relaxed">
              Located in one of Mozambique&apos;s most desirable areas, this property enjoys excellent access to local amenities, dining, and transport connections.
            </p>
          </div>
        </section>

        {/* ── Policies ── */}
        <section className="mb-24 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-[#c4c6cf]/20">
          <div>
            <h3 className="font-extrabold text-[#002045] mb-4 uppercase tracking-tighter">House Rules</h3>
            <ul className="space-y-3 text-[#43474e]">
               <li className="flex items-center gap-3"><span className="material-symbols-outlined text-lg">check</span>No Smoking</li>
               <li className="flex items-center gap-3"><span className="material-symbols-outlined text-lg">check</span>No Pets</li>
            </ul>
          </div>
          <div>
            <h3 className="font-extrabold text-[#002045] mb-4 uppercase tracking-tighter">Health & Safety</h3>
            <ul className="space-y-3 text-[#43474e]">
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-lg">security</span>24/7 On-site security guard</li>
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-lg">fire_extinguisher</span>Smoke alarm & Extinguishers</li>
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-lg">emergency</span>Dedicated backup generator</li>
            </ul>
          </div>
          <div>
            <h3 className="font-extrabold text-[#002045] mb-4 uppercase tracking-tighter">Cancellation Policy</h3>
            <p className="text-[#43474e] mb-4">Refundable for the first 48 hours. Long-term stays require 30 days notice for termination.</p>
            <a href="#" className="text-[#002045] font-bold underline underline-offset-4">Learn more</a>
          </div>
        </section>

        {/* ── Similar Properties ── */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold text-[#002045] mb-10" style={{ fontFamily: 'var(--font-headline)' }}>
            Similar luxury homes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {similar.map((p) => (
              <Link key={p.id} href={`/properties/${p.id}`} className="group cursor-pointer block">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 relative">
                  <Image
                    src={p.images[0]}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {p.isNew && (
                    <div className="absolute top-4 left-4 bg-[#691809] text-[#f17e66] px-3 py-1 rounded-full text-xs font-bold">
                      New Listing
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[#002045] text-lg" style={{ fontFamily: 'var(--font-headline)' }}>
                      {p.title}
                    </h3>
                    <p className="text-[#43474e]">{p.location}</p>
                    <p className="mt-2">
                      <span className="font-extrabold text-[#002045]">{formatPrice(p.price, p.priceUnit)}</span>
                    </p>
                  </div>
                  {p.rating && (
                    <div className="flex items-center gap-1 text-sm font-bold">
                      <span className="material-symbols-outlined text-[18px]">star</span>
                      {p.rating}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
