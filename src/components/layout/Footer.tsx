"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = newsletterEmail.trim();
    if (!email) {
      setNewsletterStatus("error");
      setNewsletterMessage(t.footer.newsletterRequired);
      return;
    }

    setNewsletterStatus("submitting");
    setNewsletterMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || t.footer.newsletterError);
      }

      setNewsletterEmail("");
      setNewsletterStatus("success");
      setNewsletterMessage(
        payload.alreadySubscribed
          ? t.footer.newsletterAlreadySubscribed
          : t.footer.newsletterSuccess
      );
    } catch (error) {
      setNewsletterStatus("error");
      setNewsletterMessage(
        error instanceof Error ? error.message : t.footer.newsletterError
      );
    }
  };

  return (
    <footer className="w-full bg-[#f2f4f6] border-t border-[#c4c6cf]/10">
      <div className="max-w-7xl mx-auto px-8 pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1 pr-4">
            <Link
              href="/"
              className="text-2xl font-black text-[#002045] tracking-tighter mb-6 block"
            >
              House in Mozambique
            </Link>
            <p className="text-[#43474e] mb-8 max-w-sm leading-relaxed text-sm">
              {t.footer.brandDesc}
            </p>
            {/* Social links moved to "Get in touch" column */}
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
                { label: t.footer.propertyRealEstate, href: "/properties" },
                { label: t.footer.assessingPictures, href: "/news" },
                { label: t.footer.realEstateAgent, href: "/agents" },
                // { label: t.footer.pricingPlans, href: "/pricing" },
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
<ul className="space-y-4 ">
  <li>
    <a
      href="tel:+258879329012"
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
        +258 879329012
      </span>
    </a>
  </li>

  <li>
    <a
      href="mailto:info@houseinmozambique.com"
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

      <span className="text-[#43474e] text-sm leading-relaxed transition-colors duration-300 group-hover:text-[#002045] ">
  info@houseinmozambique.com
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
      Av. Mozambique N1 Maputo-Zimpetu
    </span>
  </li>
</ul>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.facebook.com/share/1CQYNNJEAG/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="House in Mozambique on Facebook"
                className="w-10 h-10 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center transition-transform duration-200 transform hover:scale-110"
              >
                <img src="/Platform=Facebook,%20Color=Original.svg" alt="Facebook" className="w-5 h-5 object-contain" />
              </a>

              <a
                href="https://www.instagram.com/houseinmozambique?igsh=MXZ2eXMwZzBqano3NA%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="House in Mozambique on Instagram"
                className="w-10 h-10 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center transition-transform duration-200 transform hover:scale-110"
              >
                <img src="/Platform=Instagram,%20Color=Original.svg" alt="Instagram" className="w-5 h-5 object-contain" />
              </a>

              <a
                href="https://youtube.com/@houseinmozambique?si=ZS5ltZYL65cRMpmU"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="House in Mozambique on YouTube"
                className="w-10 h-10 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center transition-transform duration-200 transform hover:scale-110"
              >
                <img src="/Platform=YouTube,%20Color=Original.svg" alt="YouTube" className="w-5 h-5 object-contain" />
              </a>

              <a
                href="https://www.tiktok.com/@house_in_mozambique?_r=1&_t=ZS-96vgKrmit98"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="House in Mozambique on TikTok"
                className="w-10 h-10 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center transition-transform duration-200 transform hover:scale-110"
              >
                <img src="/Platform=TikTok,%20Color=Original.svg" alt="TikTok" className="w-5 h-5 object-contain" />
              </a>

              <a
                href="https://x.com/ebeb29238037?s=11"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="House in Mozambique on X"
                className="w-10 h-10 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center transition-transform duration-200 transform hover:scale-110"
              >
                <img src="/Platform=X%20(Twitter),%20Color=Original.svg" alt="X" className="w-5 h-5 object-contain" />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div >
            <h4 className="font-bold text-[#191c1e] mb-6">
              {t.footer.stayUpdated}
            </h4>
            <p className="text-[#43474e] text-sm mb-4 leading-relaxed">
              {t.footer.newsletterDesc}
            </p>
            <form className="flex gap-2" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => {
                  setNewsletterEmail(event.target.value);
                  if (newsletterStatus !== "submitting") {
                    setNewsletterStatus("idle");
                    setNewsletterMessage("");
                  }
                }}
                placeholder={t.footer.emailPlaceholder}
                aria-label={t.footer.emailPlaceholder}
                disabled={newsletterStatus === "submitting"}
                required
                className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-[#c4c6cf]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
              />
              <button
                type="submit"
                disabled={newsletterStatus === "submitting"}
                aria-label={t.footer.subscribe}
                className="bg-[#002045] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-sm">
                  {newsletterStatus === "submitting" ? "progress_activity" : "arrow_forward"}
                </span>
              </button>
            </form>
            {newsletterMessage ? (
              <p
                className={`mt-3 text-xs font-medium leading-relaxed ${
                  newsletterStatus === "success"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
                role="status"
              >
                {newsletterMessage}
              </p>
            ) : null}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#c4c6cf]/20  pt-16 pb-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#74777f] text-xs tracking-[0.15em]">
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
            {/* <Link
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
            </Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
