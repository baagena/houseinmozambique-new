import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] bg-white shadow-2xl border border-[#e5e7eb] p-10">
        <div className="space-y-4 mb-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#845326]">Terms and Conditions</p>
          <h1 className="text-4xl md:text-5xl font-black text-[#002045] leading-tight">Terms of Use for House in Mozambique</h1>
          <p className="text-lg text-[#43474e] max-w-3xl">By accessing and using our website, you agree to the following terms and conditions.</p>
        </div>

        <div className="space-y-8 text-[#43474e]">
          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">1. Acceptance of Terms</h2>
            <p>By accessing or using the House in Mozambique website (“Website”), you agree to comply with and be legally bound by these Terms and Conditions. If you do not agree with any part of these Terms, you must discontinue use of the Website immediately.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">2. Eligibility</h2>
            <p>You must be at least 18 years old and legally capable of entering into binding agreements to use this Website. By using the Website, you represent and warrant that you are legally authorized to enter into contracts, all information you provide is accurate and truthful, and your use of the Website complies with applicable laws.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">3. Services Provided</h2>
            <p>House in Mozambique may provide services including but not limited to property listings, property advertising and promotions, real estate information and market insights, communication between buyers, sellers, agents, and landlords, property inquiry and lead generation services, premium listing subscriptions, and digital marketing services related to real estate.</p>
            <p>We reserve the right to modify, suspend, or discontinue any service at any time without prior notice.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">4. User Accounts</h2>
            <p>Users may be required to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Promptly notify us of unauthorized access or security breaches.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">5. Property Listings</h2>
            <p>Users posting property listings agree that all information provided is accurate and lawful, that they have authority to advertise the property, that listings do not contain false or misleading content, and that uploaded content does not infringe third-party rights. House in Mozambique does not guarantee the accuracy, legality, ownership, availability, or condition of listed properties.</p>
            <p>We reserve the right to edit, reject, suspend, or remove listings at our discretion.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">6. Website Use Restrictions</h2>
            <p>Users agree NOT to use the Website for unlawful purposes, post fraudulent or misleading content, violate intellectual property rights, attempt unauthorized access, upload malware, scrape or reproduce content without permission, use automated systems without authorization, harass or abuse others, or interfere with Website functionality or security. Violations may result in suspension, legal action, or permanent banning.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">7. Intellectual Property Rights</h2>
            <p>All Website content, including logos, branding, design, text, images, software, and databases, are the property of House in Mozambique or its licensors and are protected by applicable intellectual property laws. Users may not reproduce, distribute, modify, or exploit Website content without written consent.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">8. Third-Party Links and Services</h2>
            <p>The Website may contain links to third-party websites or services. House in Mozambique does not endorse or assume responsibility for third-party content, external websites, payment systems, advertisements, or services provided by third parties. Users access third-party services at their own risk.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">9. Payments and Fees</h2>
            <p>Certain services may require payment. By purchasing paid services, you agree to pay all applicable fees, provide accurate billing information, and comply with payment terms. Unless otherwise stated, payments are non-refundable and pricing may change without prior notice.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">10. Disclaimer</h2>
            <p>The Website and services are provided on an “AS IS” and “AS AVAILABLE” basis. House in Mozambique makes no warranties regarding accuracy of listings, property availability, suitability of properties, Website uptime, or error-free operation. We do not provide legal, financial, investment, or professional real estate advice unless explicitly stated.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">11. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, House in Mozambique and its affiliates shall not be liable for indirect or consequential damages, loss of profits, business interruption, data loss, property transaction disputes, fraudulent listings, or technical failures.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">12. Indemnification</h2>
            <p>You agree to indemnify and hold House in Mozambique harmless from any claims, liabilities, damages, losses, costs, or expenses arising from your use of the Website or violation of these Terms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">13. Governing Law</h2>
            <p>These Terms shall be governed by the laws of Mozambique, and disputes will be subject to the exclusive jurisdiction of Mozambique courts.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">14. Changes to Terms</h2>
            <p>House in Mozambique reserves the right to update or modify these Terms at any time. Continued use of the Website after changes constitutes acceptance of the revised Terms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-black text-[#002045]">15. Contact</h2>
            <p>For inquiries regarding these Terms, please contact House in Mozambique at nshimiyimanac@gmail.com or call +258 250329118.</p>
            <p>Address: Av. MOZAMBIQUE N1, Maputo-Zimpetu</p>
          </section>

          <div className="pt-6 border-t border-[#e5e7eb]">
            <Link href="/privacy" className="text-sm font-bold text-[#002045] hover:underline">Read Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
