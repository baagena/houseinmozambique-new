import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-[#f2f4f6] border-t border-[#c4c6cf]/10">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2 pr-4">
            <Link
              href="/"
              className="text-2xl font-black text-[#002045] tracking-tighter mb-6 block"
            >
              House in Mozambique
            </Link>
            <p className="text-[#43474e] mb-8 max-w-sm leading-relaxed text-sm">
              {t.footer.brandDesc}
            </p>
            {/* <div className="flex gap-4">
              {(["share", "alternate_email", "public"] as const).map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="w-10 h-10 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center text-[#002045] hover:bg-[#002045] hover:text-white transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-xl">
                    {icon}
                  </span>
                </a>
              ))}
            </div> */}
          </div>

          {/* Discover */}
          <div>
            <h4 className="font-bold text-[#191c1e] mb-6">
              {t.footer.discover}
            </h4>
            <ul className="space-y-4">
              {[
                // { label: t.footer.marketReports, href: "#" },
                // { label: t.footer.neighborhoodGuides, href: "#" },
                { label: t.footer.privacyPolicy, href: "/privacy" },
                { label: t.footer.termsOfService, href: "/terms" },
                { label: t.footer.pricingPlans, href: "/pricing" },
                { label: t.footer.contactUs, href: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[#43474e] hover:text-[#002045] transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          {/* <div>
            <h4 className="font-bold text-[#191c1e] mb-6">{t.footer.legal}</h4>
            <ul className="space-y-4">
              {[
                { label: t.footer.privacyPolicy, href: "/privacy" },
                { label: t.footer.termsOfService, href: "/terms" },
                { label: t.footer.cookiePolicy, href: "#" },
                { label: t.footer.agentAgreement, href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[#43474e] hover:text-[#002045] transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div> */}

          {/* Legal */}
          <div>
            <h4 className="font-bold text-[#191c1e] mb-6">{t.footer.getInTouch}</h4>
<ul className="space-y-4">
  <li>
    <a
      href="tel:+250788308665"
      className="group flex items-center gap-3 transition-all duration-300"
    >
      <span>
        <svg
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          width="16"
          height="16"
          className="text-[#43474e] transition-colors duration-300 group-hover:text-[#002045]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M13.832 16.568a1 1 0 0 0 1.213-0.303L15.4 15.8A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4 2 2 0 0 1 4 2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-0.8 1.6L7.732 8.951a1 1 0 0 0-0.292 1.233 14 14 0 0 0 6.392 6.384" />
        </svg>
      </span>

      <span className="text-[#43474e] text-sm leading-relaxed transition-colors duration-300 group-hover:text-[#002045]">
        +250 788 308 665
      </span>
    </a>
  </li>

  <li>
    <a
      href="mailto:nshimiyimanac@gmail.com"
      className="group flex items-center gap-3 transition-all duration-300"
    >
      <span>
        <svg
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          width="16"
          height="16"
          className="text-[#43474e] transition-colors duration-300 group-hover:text-[#002045]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M22 7l-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
          <rect width="20" height="16" rx="2" x="2" y="4" />
        </svg>
      </span>

      <span className="text-[#43474e] text-sm leading-relaxed transition-colors duration-300 group-hover:text-[#002045]">
        nshimiyimanac@gmail.com
      </span>
    </a>
  </li>

  <li className="flex items-center gap-3">
    <span>
      <svg
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        width="16"
        height="16"
        className="text-[#43474e]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </span>

    <span className="text-[#43474e] text-sm leading-relaxed">
      Av. MOZAMBIQUE N1 Maputo-Zimpetu
    </span>
  </li>
</ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-[#191c1e] mb-6">
              {t.footer.stayUpdated}
            </h4>
            <p className="text-[#43474e] text-sm mb-4 leading-relaxed">
              {t.footer.newsletterDesc}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t.footer.emailPlaceholder}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-[#c4c6cf]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
              />
              <button className="bg-[#002045] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#c4c6cf]/20 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#74777f] text-xs tracking-[0.15em] uppercase">
            {t.footer.copyright}
          </p>
          <div className="flex gap-6 text-xs text-[#74777f]">
            <Link
              href="/privacy"
              className="hover:text-[#002045] transition-colors"
            >
              {t.footer.privacy}
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#002045] transition-colors"
            >
              {t.footer.terms}
            </Link>
            <Link
              href="/pricing"
              className="hover:text-[#002045] transition-colors"
            >
              {t.nav.pricing}
            </Link>
            <Link
              href="/agents"
              className="hover:text-[#002045] transition-colors"
            >
              {t.nav.agents}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
