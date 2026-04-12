'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const VILLA_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuWSUXLzid2u3OTERtIK6qJpnQlbOOhtVc8LqRxn7Hrx7ruVHxYBf8--9D8l6yM3GhgeRVipuoE11QCFta8tp1kWWb90aRa29GOMGpZxetULhNqwHN9tg4DZJDQxxvHeC-Bc3s1qnnRU9xhJbqMu-ghY4452JCSdw7aDslq4hnlZFFAWHbV07Uq3tveepD8WDCZTmpWuIOLlG2eJpCcRD1tC_uwEg4ED4mP7Gc4i8hoQXD_vB7MunEBhDwdlvRjJzo8dR2NdGnUEs';

const plans = [
  {
    name: 'Standard',
    price: '$29',
    unit: '/ listing',
    description: 'Perfect for individual homeowners looking for a quick sale.',
    features: [
      { label: 'Single Property Listing', included: true, star: false },
      { label: '15 High-res Photos', included: true, star: false },
      { label: 'Featured Listing', included: false, star: false },
      { label: 'Professional Photography', included: false, star: false },
    ],
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '$99',
    unit: '/ listing',
    description: 'Our most popular choice for serious sellers and boutiques.',
    badge: 'Recommended',
    features: [
      { label: 'Featured Listing (7 Days)', included: true, star: true },
      { label: '30 High-res Photos', included: true, star: false },
      { label: 'Social Media Promotion', included: true, star: false },
      { label: 'Priority Support', included: true, star: false },
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact',
    unit: '/ custom',
    description: 'Tailored solutions for real estate agencies and developers.',
    features: [
      { label: 'Unlimited Listings', included: true, star: false },
      { label: 'Agent Dashboard & Analytics', included: true, star: false },
      { label: 'Professional Photography', included: true, star: false },
      { label: 'Dedicated Account Manager', included: true, star: false },
    ],
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'How much does it cost to list?',
    a: 'Listing costs vary based on the tier you select. Our Standard tier starts at $29 per listing, while the Premium tier is $99. Enterprise customers can contact us for custom volume-based pricing.',
  },
  {
    q: 'How do I contact agents?',
    a: 'Each property listing features a dedicated contact module. You can send a direct message, request a callback, or schedule a viewing through the integrated calendar system on the listing page.',
  },
  {
    q: 'Can I list multiple properties?',
    a: 'Absolutely. Individual owners can purchase single listings, while professional agents typically opt for our Enterprise plan which allows for unlimited or bulk listing capabilities.',
  },
  {
    q: 'What is the curation process?',
    a: 'Every listing submitted to HouseinMozambique goes through a quality review by our curation team. We verify accuracy and ensure images meet our aesthetic standards to maintain the premium feel of the platform.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="pt-20 bg-[#f7f9fb]">
      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden bg-[#f2f4f6]">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          <span className="inline-block py-1 px-4 mb-6 bg-[#845326] text-white rounded-full text-xs font-bold uppercase tracking-widest">
            Pricing Strategy
          </span>
          <h1
            className="text-5xl md:text-7xl font-extrabold text-[#191c1e] tracking-tighter mb-8 max-w-4xl"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            List Your Property{' '}
            <span className="text-[#845326]">with Confidence</span>
          </h1>
          <p className="text-lg md:text-xl text-[#43474e] max-w-2xl leading-relaxed mb-12">
            Choose the plan that best fits your needs as an individual owner or professional agent. Experience the premier digital gallery of Mozambique.
          </p>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#002045]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-48 w-[32rem] h-[32rem] bg-[#845326]/5 rounded-full blur-[100px]" />
      </section>

      {/* Pricing Cards */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col p-8 rounded-xl relative ${
                plan.highlighted
                  ? 'bg-[#002045] text-white shadow-2xl scale-105 z-10'
                  : 'bg-white hover:bg-[#e6e8ea] transition-colors duration-300'
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#845326] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  {plan.badge}
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlighted ? 'text-[#86a0cd]' : 'text-[#43474e]'}`}>
                  {plan.description}
                </p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-extrabold" style={{ fontFamily: 'var(--font-headline)' }}>
                  {plan.price}
                </span>
                <span className={plan.highlighted ? 'text-[#86a0cd]' : 'text-[#43474e]'}>{plan.unit}</span>
              </div>
              <ul className="mb-12 space-y-4 flex-grow">
                {plan.features.map((f) => (
                  <li key={f.label} className={`flex items-center gap-3 text-sm ${!f.included ? 'opacity-40' : ''}`}>
                    <span className={`material-symbols-outlined text-xl ${
                      f.included
                        ? plan.highlighted ? 'text-[#fab983]' : 'text-[#845326]'
                        : 'text-[#74777f]'
                    }`}>
                      {f.included ? (f.star ? 'stars' : 'check_circle') : 'do_not_disturb_on'}
                    </span>
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.name === 'Enterprise' ? '/auth/agent-register' : `/auth?redirect=/post-property&plan=${plan.name.toLowerCase()}`}
                className={`w-full py-4 rounded-lg font-bold text-center block transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-[#845326] text-white hover:opacity-90'
                    : 'bg-[#e0e3e5] text-[#002045] hover:bg-[#002045] hover:text-white'
                }`}
              >
                {plan.name === 'Enterprise' ? 'Contact Our Team' : 'Post Your House'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Why List With Us */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2 relative">
            <div className="aspect-[4/5] bg-[#f2f4f6] rounded-xl overflow-hidden shadow-2xl">
              <Image src={VILLA_IMG} alt="Luxury Villa" fill className="object-cover" />
            </div>
            <div className="absolute -bottom-8 -right-8 w-64 p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-xl hidden md:block border border-[#c4c6cf]/10">
              <h4 className="font-bold text-[#002045] mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
                Exclusive Curation
              </h4>
              <p className="text-xs text-[#43474e] leading-relaxed">
                We only feature properties that meet our architectural and aesthetic standards, ensuring a premium experience for every buyer.
              </p>
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <h2
              className="text-4xl font-extrabold text-[#002045] tracking-tight mb-6"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Why List With Us?
            </h2>
            <div className="space-y-8">
              {[
                { icon: 'visibility', title: 'High-Intent Audience', desc: 'Reach investors and home-seekers specifically looking for premium Mozambique real estate.' },
                { icon: 'camera_enhance', title: 'Editorial Presentation', desc: 'Every listing is styled with an editorial approach, making your property stand out as a work of art.' },
                { icon: 'analytics', title: 'In-Depth Insights', desc: 'Access data on how your listing is performing, including engagement rates and lead quality.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#845326]/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#845326]">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1" style={{ fontFamily: 'var(--font-headline)' }}>{item.title}</h4>
                    <p className="text-[#43474e] text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-[#f2f4f6]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-extrabold text-[#002045] mb-4"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-[#43474e]">Everything you need to know about the HouseinMozambique experience.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden transition-all duration-300">
                <button
                  className="w-full flex items-center justify-between p-6 text-left group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-bold text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
                    {faq.q}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[#43474e] transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-[#43474e] text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
