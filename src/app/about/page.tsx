import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] bg-white shadow-2xl border border-[#e5e7eb] p-10">
        <div className="space-y-4 mb-10">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#845326]">About Us</p>
          <h1 className="text-4xl md:text-5xl font-black text-[#002045] leading-tight">Welcome to House in Mozambique</h1>
          <p className="text-lg text-[#43474e] max-w-3xl">A digital real estate platform dedicated to connecting property buyers, sellers, landlords, tenants, investors, and real estate professionals across Mozambique.</p>
        </div>

        <div className="space-y-10 text-[#43474e]">
          <div className="space-y-4">
            <p>Our platform provides property listings, real estate information, marketing services, and communication tools intended to simplify and modernize the real estate experience in Mozambique.</p>
            <p>We strive to create a transparent, reliable, and accessible marketplace for residential, commercial, industrial, and investment properties.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
              <h2 className="text-xl font-black text-[#002045] mb-4">Mission Statement</h2>
              <p>Our mission is to simplify property discovery and real estate transactions in Mozambique by providing a trusted, innovative, and user-friendly digital platform that connects people with opportunities in the property market.</p>
              <p className="mt-4">We are committed to professionalism, transparency, integrity, and customer satisfaction while contributing to the growth and modernization of the Mozambican real estate industry.</p>
            </section>
            <section className="rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
              <h2 className="text-xl font-black text-[#002045] mb-4">Vision Statement</h2>
              <p>Our vision is to become the leading and most trusted online real estate marketplace in Mozambique and across Southern Africa by empowering individuals and businesses through technology-driven property solutions.</p>
              <p className="mt-4">We aim to redefine how people buy, sell, rent, and invest in property through innovation, reliability, and exceptional customer experience.</p>
            </section>
          </div>

          <div className="pt-6 border-t border-[#e5e7eb]">
            <Link href="/" className="text-sm font-bold text-[#002045] hover:underline">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
