'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import { initAuth, getAuth, clearAuth } from '@/lib/auth';
import { useLanguage } from '@/components/i18n/LanguageContext';

const navLinkKeys = [
  { href: '/', key: 'home' },
  { href: '/properties?type=Rent', key: 'rent' },
  { href: '/properties?type=Buy', key: 'buy' },
  { href: '/properties?type=Short+Stay', key: 'shortStay' },
  { href: '/properties?type=Auction', key: 'auction' },
  { href: '/contact', key: 'contact' },
];

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isDevMode, setIsDevMode] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read auth state using centralized utility after mount
  useEffect(() => {
    const auth = initAuth();
    setIsLoggedIn(auth.isLoggedIn);
    setUserName(auth.userName);
    setIsDevMode(!!auth.isDevAutoLogin);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    clearAuth();
    setIsLoggedIn(false);
    setIsDevMode(false);
    setDropdownOpen(false);
    router.push('/');
  };

  // Hide Navbar on specific routes (Auth, Dashboard, Post Property)
  const hideNavbarPaths = ['/auth', '/dashboard', '/post-property'];
  if (hideNavbarPaths.some(path => pathname?.startsWith(path))) return null;

  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-[12px] shadow-sm border-b border-[#c4c6cf]/10">
      <div className="flex justify-between items-center px-6 lg:px-8 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 transition-transform group-hover:scale-105">
            <Image src="/logo.png" alt="House in Mozambique Ltd" fill className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-[#002045] tracking-tighter leading-none">House in Mozambique</span>
            <span className="text-[10px] font-bold text-[#845326] uppercase tracking-[0.2em] leading-none mt-1">Limited</span>
          </div>
        </Link>

        {/* Desktop Nav & Actions Grouped on Right */}
        <div className="hidden md:flex items-center gap-10">
          <div className="flex items-center gap-8">
            {navLinkKeys.map((link) => {
              const url = new URL(link.href, 'http://localhost');
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
                  {(t.nav as any)[link.key]}
                </Link>
              );
            })}
          </div>
  
          {/* Language Switcher */}
          <div className="flex items-center bg-[#f2f4f6] rounded-lg p-1 border border-[#c4c6cf]/20">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded-md text-[10px] font-black transition-all ${lang === 'en' ? 'bg-[#002045] text-white shadow-sm' : 'text-[#74777f] hover:text-[#002045]'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('pt')}
              className={`px-2 py-1 rounded-md text-[10px] font-black transition-all ${lang === 'pt' ? 'bg-[#002045] text-white shadow-sm' : 'text-[#74777f] hover:text-[#002045]'}`}
            >
              PT
            </button>
          </div>

          {/* Visual Separator */}
          <div className="hidden md:block h-6 w-px bg-slate-200 mx-1" />
  
          {/* CTA Group */}
          <div className="flex items-center gap-3">
            {/* Sign In (logged out, desktop only) */}
            {!isLoggedIn && (
              <Link
                href="/auth"
                className="hidden md:block text-sm font-bold text-slate-600 hover:text-[#002045] transition-colors"
              >
                {t.nav.signIn}
              </Link>
            )}

            {/* Post a House — always visible action button */}
            <Link
              href="/pricing"
              className="bg-[#002045] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-[#002045]/20"
            >
              {t.nav.postHouse}
            </Link>

            {/* User avatar — to the RIGHT of the action button, only when logged in */}
            {isLoggedIn && (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="relative group transition-all duration-500"
                  aria-label="User menu"
                >
                  {/* Architectural Avatar Container */}
                  <div className="w-9 h-9 rounded-lg bg-[#002045] border border-[#845326]/30 flex items-center justify-center shadow-lg group-hover:shadow-[#002045]/20 group-hover:border-[#845326] transition-all duration-300 overflow-hidden relative">
                    {/* Subtle inner sheen */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
                    
                    {/* Headline Initials */}
                    <span className="text-[10px] font-bold text-white tracking-[0.2em] leading-none translate-x-[0.5px] [font-family:var(--font-headline)]">
                      {userInitials}
                    </span>
                  </div>
                  
                  {/* Refined Status Orb */}
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm z-10" />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-60 bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,32,69,0.12)] border border-[#eef0f2] overflow-hidden z-50">
                    {/* User info */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f2f4f6]">
                      <div className="w-11 h-11 rounded-lg bg-[#002045] border border-[#845326]/20 flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" />
                        <span className="text-sm font-bold text-white tracking-[0.1em] [font-family:var(--font-headline)]">
                          {userInitials}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-[#002045] tracking-tight leading-tight">{userName}</p>
                          {isDevMode && (
                            <span className="bg-[#845326]/10 text-[#845326] text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">Dev</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#74777f] font-medium uppercase tracking-widest">{t.auth.premiumAgent}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      <Link
                        href="/dashboard/agent/listings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f7f9fb] transition-colors text-sm font-bold text-[#002045]"
                      >
                        <span className="material-symbols-outlined text-lg text-[#845326]">dashboard</span>
                        {t.auth.myListings}
                      </Link>
                      <Link
                        href="/pricing"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f7f9fb] transition-colors text-sm font-bold text-[#002045]"
                      >
                        <span className="material-symbols-outlined text-lg text-[#845326]">workspace_premium</span>
                        {t.auth.upgradePlan}
                      </Link>
                    </div>

                    {/* Sign out */}
                    <div className="p-2 border-t border-[#f2f4f6]">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm font-bold text-red-500"
                      >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        {t.auth.signOut}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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



      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#c4c6cf]/20 px-6 pb-6 pt-4 space-y-2">
          {navLinkKeys.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block font-bold text-[#002045] text-base py-2 hover:text-[#845326] transition-colors"
            >
              {(t.nav as any)[link.key]}
            </Link>
          ))}
          <Link
            href="/pricing"
            onClick={() => setMobileOpen(false)}
            className="block font-bold text-[#002045] text-base py-2 hover:text-[#845326] transition-colors"
          >
            {t.nav.pricing}
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileOpen(false)}
            className="mt-2 block text-center bg-[#002045] text-white px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-all font-headline"
          >
            {t.nav.postHouse}
          </Link>

          <div className="flex items-center justify-center gap-6 py-4 bg-[#f2f4f6] rounded-xl mt-4">
            <button
              onClick={() => setLang('en')}
              className={`flex flex-col items-center gap-1 transition-all ${lang === 'en' ? 'text-[#002045] scale-110' : 'text-[#74777f] opacity-50'}`}
            >
              <span className="text-xs font-black">ENGLISH</span>
              {lang === 'en' && <div className="w-1 h-1 bg-[#002045] rounded-full" />}
            </button>
            <div className="w-px h-8 bg-[#c4c6cf]" />
            <button
              onClick={() => setLang('pt')}
              className={`flex flex-col items-center gap-1 transition-all ${lang === 'pt' ? 'text-[#002045] scale-110' : 'text-[#74777f] opacity-50'}`}
            >
              <span className="text-xs font-black">PORTUGUÊS</span>
              {lang === 'pt' && <div className="w-1 h-1 bg-[#002045] rounded-full" />}
            </button>
          </div>

          <div className="border-t border-[#f2f4f6] pt-4 mt-2">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#002045] border border-[#845326]/30 flex items-center justify-center shadow-md">
                    <span className="text-xs font-bold text-white tracking-[0.2em] [font-family:var(--font-headline)]">
                      {userInitials}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#002045]">{userName}</p>
                    <p className="text-[10px] text-[#74777f] uppercase tracking-widest">{t.auth.premiumAgent}</p>
                  </div>
                </div>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 font-bold text-red-500 text-sm py-2"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  {t.auth.signOut}
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMobileOpen(false)}
                className="block font-bold text-slate-600 text-base py-2"
              >
                {t.nav.signIn}
              </Link>
            )}
          </div>
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
