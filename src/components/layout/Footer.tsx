import Link from 'next/link';

export default function Footer() {
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
              HouseinMozambique
            </Link>
            <p className="text-[#43474e] mb-8 max-w-sm leading-relaxed text-sm">
              Providing the finest real estate opportunities across Mozambique. Experience institutional trust with a local touch. From Maputo lofts to Bazaruto retreats.
            </p>
            <div className="flex gap-4">
              {(['share', 'alternate_email', 'public'] as const).map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="w-10 h-10 rounded-full bg-white border border-[#c4c6cf]/20 flex items-center justify-center text-[#002045] hover:bg-[#002045] hover:text-white transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-xl">{icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Discover */}
          <div>
            <h4 className="font-bold text-[#191c1e] mb-6">Discover</h4>
            <ul className="space-y-4">
              {['Market Reports', 'Neighborhood Guides', 'Pricing & Plans', 'Contact Us'].map((item) => (
                <li key={item}>
                  <Link
                    href={item === 'Pricing & Plans' ? '/pricing' : '#'}
                    className="text-[#43474e] hover:text-[#002045] transition-colors text-sm font-medium"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-[#191c1e] mb-6">Legal</h4>
            <ul className="space-y-4">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Agent Agreement'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-[#43474e] hover:text-[#002045] transition-colors text-sm font-medium">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-[#191c1e] mb-6">Stay Updated</h4>
            <p className="text-[#43474e] text-sm mb-4 leading-relaxed">
              Get the latest agent listings and market insights delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-[#c4c6cf]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#002045]/20"
              />
              <button className="bg-[#002045] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#c4c6cf]/20 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#74777f] text-xs tracking-[0.15em] uppercase">
            © 2024 HouseinMozambique. The Modern Estate Agent.
          </p>
          <div className="flex gap-6 text-xs text-[#74777f]">
            <a href="#" className="hover:text-[#002045] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#002045] transition-colors">Terms</a>
            <Link href="/pricing" className="hover:text-[#002045] transition-colors">Pricing</Link>
            <Link href="/agents" className="hover:text-[#002045] transition-colors">Agents</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
