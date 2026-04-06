'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/properties?type=Rent', label: 'Rent' },
  { href: '/properties?type=Buy', label: 'Buy' },
  { href: '/properties?type=Short+Stay', label: 'Short Stay' },
  { href: '/agents', label: 'Agents' },
];

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide Navbar on specific focused pages (Signin/Signup)
  if (pathname?.startsWith('/auth')) return null;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-[12px] shadow-sm border-b border-[#c4c6cf]/10">
      <div className="flex justify-between items-center px-6 lg:px-8 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold text-[#002045] tracking-tighter"
        >
          HouseinMozambique
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const url = new URL(link.href, 'http://localhost'); // dummy base
            const linkPath = url.pathname;
            const linkType = url.searchParams.get('type');
            
            const isPathActive = linkPath === '/' ? pathname === '/' : pathname === linkPath;
            const isTypeActive = linkType ? searchParams.get('type') === linkType : true;
            
            const isActive = isPathActive && isTypeActive;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-bold tracking-tight text-sm transition-colors ${
                  isActive
                    ? 'text-[#002045] border-b-2 border-[#002045] pb-1'
                    : 'text-slate-600 hover:text-[#002045]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link
            href="/auth"
            className="hidden md:block text-sm font-bold text-slate-600 hover:text-[#002045] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/post-property"
            className="bg-[#002045] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-[#002045]/20"
          >
            Post a House
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#e6e8ea] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[#002045]">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#c4c6cf]/20 px-6 pb-6 pt-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block font-bold text-[#002045] text-base py-2 hover:text-[#845326] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/pricing"
            onClick={() => setMobileOpen(false)}
            className="block font-bold text-[#002045] text-base py-2 hover:text-[#845326] transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/auth"
            onClick={() => setMobileOpen(false)}
            className="block font-bold text-slate-600 text-base py-2"
          >
            Sign In
          </Link>
        </div>
      )}
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  );
}
