import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] bg-white shadow-2xl border border-[#e5e7eb] p-10">
        <div className="space-y-4 mb-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#845326]">Privacy Policy</p>
          <h1 className="text-4xl md:text-5xl font-black text-[#002045] leading-tight">Privacy, Trust, and Transparency</h1>
          <p className="text-lg text-[#43474e] max-w-3xl">House in Mozambique respects your privacy and is committed to protecting the information you share while using our website.</p>
        </div>

        <div className="space-y-8 text-[#43474e]">
          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">What We Collect</h2>
            <p>We may collect information you provide directly, such as contact details, listing information, and account settings. We also gather technical information to help improve the website and keep our platform secure.</p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">How We Use It</h2>
            <p>We use your information to deliver the services you request, communicate on listing activity, provide support, and help match buyers, sellers, agents, and tenants.</p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">Sharing and Security</h2>
            <p>We do not sell your personal data. We may share information with service providers that support our platform and with trusted partners only when required to fulfill your request.</p>
            <p>We maintain administrative, technical, and physical safeguards to protect your information.</p>
          </section>

          <section className="space-y-3 rounded-[1.75rem] bg-[#f7f9fb] p-8 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#002045]">Website Disclaimer</h2>
            <p>House in Mozambique acts solely as an online platform for advertising and information purposes and is not a direct party to property transactions unless otherwise expressly stated. Users are responsible for conducting due diligence before engaging in any real estate transaction.</p>
          </section>

          <div className="pt-6 border-t border-[#e5e7eb]">
            <Link href="/terms" className="text-sm font-bold text-[#002045] hover:underline">Read the full Terms and Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
