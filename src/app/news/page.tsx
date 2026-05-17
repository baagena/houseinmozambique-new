import Link from 'next/link';

export default function NewsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] bg-white shadow-2xl border border-[#e5e7eb] p-10">
        <div className="flex flex-col gap-3 mb-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#845326]">This is the announcement</p>
          <h1 className="text-4xl md:text-5xl font-black text-[#002045] leading-tight">Welcome to the Future of Real Estate in Mozambique</h1>
          <p className="text-sm uppercase tracking-[0.2em] text-[#74777f]">İyi izajya hariya Kuri: NEWS</p>
        </div>

        <div className="space-y-8 text-[#43474e]">
          <p className="text-lg font-semibold text-[#002045]">At House in Mozambique, we are transforming the way properties are advertised, discovered, and connected across Mozambique.</p>
          <p>Our mission is clear: to become the leader in real estate advertisement by delivering professional, trusted, and innovative real estate marketing solutions every single day.</p>
          <p>We proudly position ourselves as the real estate hub — a central platform where property owners, buyers, investors, agents, and businesses meet to explore quality real estate opportunities with confidence.</p>

          <div className="rounded-[1.75rem] bg-[#f7f9fb] border border-[#e5e7eb] p-8">
            <h2 className="text-2xl font-black text-[#002045] mb-4">What We Do Daily</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#002045]">Real Estate Expertise</h3>
                <p className="mt-2 text-[#43474e]">Our team works daily to provide reliable market knowledge, strategic property exposure, and professional guidance that helps clients make informed real estate decisions.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#002045]">Property Advertisement</h3>
                <p className="mt-2 text-[#43474e]">We specialize in promoting residential, commercial, industrial, and investment properties through effective digital marketing and targeted advertising.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#002045]">Property Photography</h3>
                <p className="mt-2 text-[#43474e]">We believe every property deserves to be presented at its best. That is why we provide high-quality property photography services designed to capture attention, increase visibility, and create stronger market appeal.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#002045]">Verified Asset Concierge</h3>
                <p className="mt-2 text-[#43474e]">Trust and transparency are essential in real estate. Our verified asset concierge service helps ensure that listed properties are professionally reviewed and presented with credibility.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-black text-[#002045]">Our Commitment</h2>
            <p>Every day, we work to connect people with opportunities, promote properties with excellence, and build a trusted real estate ecosystem for Mozambique and beyond.</p>
            <p>Whether you are selling, renting, investing, or searching for your next property, House in Mozambique is your trusted destination for professional real estate advertising and services.</p>
            <p className="text-lg font-black text-[#002045]">House in Mozambique — Your Property. Our Expertise. Your Future.</p>
          </div>

          <div className="pt-6 border-t border-[#e5e7eb]">
            <Link href="/" className="text-sm font-bold text-[#002045] hover:underline">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
