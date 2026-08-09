'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import { logout } from '@/lib/auth';
import { useLanguage } from '@/components/i18n/LanguageContext';

type NavKey = 'home' | 'properties' | 'about' | 'news' | 'contact';

const navLinkKeys: Array<{ href: string; key: NavKey }> = [
  { href: '/', key: 'home' },
  { href: '/properties', key: 'properties' },
  { href: '/about', key: 'about' },
  { href: '/news', key: 'news' },
  { href: '/contact', key: 'contact' },
];

/**
 * Listing-type shortcuts. `type` matches Property.listingType in the database and
 * is read from the `type` query param by the properties page.
 */
type CategoryKey = 'forSale' | 'forRent' | 'shortStays' | 'auctions' | 'allProperties';

const propertyCategories: Array<{ type: string; key: CategoryKey; descKey: string; icon: string }> = [
  { type: 'Buy', key: 'forSale', descKey: 'forSaleDesc', icon: 'sell' },
  { type: 'Rent', key: 'forRent', descKey: 'forRentDesc', icon: 'vpn_key' },
  { type: 'Short Stay', key: 'shortStays', descKey: 'shortStaysDesc', icon: 'weekend' },
  { type: 'Auction', key: 'auctions', descKey: 'auctionsDesc', icon: 'gavel' },
  { type: '', key: 'allProperties', descKey: 'allPropertiesDesc', icon: 'grid_view' },
];

const categoryHref = (type: string) =>
  type ? `/properties?type=${encodeURIComponent(type)}` : '/properties';

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('AGENT');
  const { lang, setLang, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Read auth state from server session on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!mounted) return;
        if (!res.ok) {
          setIsLoggedIn(false);
          setUserName('');
          setUserRole('AGENT');
          return;
        }
        const data = await res.json();
        setIsLoggedIn(true);
        setUserName(data.user?.name || '');
        setUserRole(data.user?.role || 'AGENT');
      } catch {
        if (!mounted) return;
        setIsLoggedIn(false);
        setUserName('');
        setUserRole('AGENT');
      }
    })();
    return () => { mounted = false; };
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setCategoriesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Close the category menu whenever navigation happens
  useEffect(() => {
    setCategoriesOpen(false);
  }, [pathname, searchParams]);

  const handleSignOut = async () => {
    await logout();
    setIsLoggedIn(false);
    setUserRole('AGENT');
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
  const dashboardHref = userRole === 'ADMIN' ? '/dashboard/admin' : '/dashboard/agent';

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-[12px] shadow-sm border-b border-[#c4c6cf]/10">
      <div className="flex justify-between items-center px-6 lg:px-8 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 transition-transform group-hover:scale-105">
            <Image src="/logo.png" alt="House in Mozambique Ltd" fill className="object-contain" />
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-xl font-black text-[#002045] tracking-tighter leading-none">House in Mozambique</span>
            <span className="text-sm font-bold text-[#845326] uppercase tracking-[0.2em] leading-none">Ltd</span>
          </div>
        </Link>

        {/* Desktop Nav Center */}
        <div className="hidden md:flex flex-1 justify-center items-center">
          <div className="flex items-center gap-8">
            {navLinkKeys.map((link) => {
              const url = new URL(link.href, 'http://localhost');
              const linkPath = url.pathname;
              const linkType = url.searchParams.get('type');
              const isPathActive = linkPath === '/' ? pathname === '/' : pathname === linkPath;
              const isTypeActive = linkType ? searchParams.get('type') === linkType : true;
              const isActive = isPathActive && isTypeActive;

              // Properties opens a menu of listing categories instead of navigating directly
              if (link.key === 'properties') {
                const activeType = searchParams.get('type') || '';
                return (
                  <div
                    key={link.href}
                    ref={categoriesRef}
                    className="relative"
                    onMouseEnter={() => setCategoriesOpen(true)}
                    onMouseLeave={() => setCategoriesOpen(false)}
                  >
                    <button
                      onClick={() => setCategoriesOpen((open) => !open)}
                      aria-expanded={categoriesOpen}
                      aria-haspopup="true"
                      className={`flex items-center gap-1 font-bold tracking-tight text-sm transition-colors ${
                        isActive
                          ? 'text-[#002045] border-b-2 border-[#002045] pb-1'
                          : 'text-slate-600 hover:text-[#002045]'
                      }`}
                    >
                      {t.nav.properties}
                      <span
                        className={`material-symbols-outlined text-base transition-transform ${categoriesOpen ? 'rotate-180' : ''}`}
                      >
                        expand_more
                      </span>
                    </button>

                    {categoriesOpen && (
                      <div className="absolute left-1/2 top-full -translate-x-1/2 pt-4 z-50">
                        <div className="w-[320px] bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,32,69,0.14)] border border-[#eef0f2] overflow-hidden p-2">
                          {propertyCategories.map((cat) => {
                            const isCatActive = pathname === '/properties' && activeType === cat.type;
                            return (
                              <Link
                                key={cat.key}
                                href={categoryHref(cat.type)}
                                onClick={() => setCategoriesOpen(false)}
                                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                                  isCatActive ? 'bg-[#002045]/5' : 'hover:bg-[#f7f9fb]'
                                }`}
                              >
                                <span className="material-symbols-outlined text-lg text-[#845326] mt-0.5">
                                  {cat.icon}
                                </span>
                                <span className="flex flex-col">
                                  <span className="text-sm font-bold text-[#002045] leading-tight">
                                    {t.nav[cat.key]}
                                  </span>
                                  <span className="text-[11px] font-medium text-[#74777f] leading-snug mt-0.5">
                                    {t.nav[cat.descKey]}
                                  </span>
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

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
                  {t.nav[link.key]}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop Actions Group */}
        <div className="hidden md:flex items-center gap-4">
          {/* Sign In (logged out, desktop only) */}
          {!isLoggedIn && (
            <Link
              href="/auth"
              className="text-sm font-bold text-slate-600 hover:text-[#002045] transition-colors"
            >
              {t.nav.signIn}
            </Link>
          )}

          {/* Post a House — smaller button */}
          <Link
            href="/pricing"
            className="bg-[#002045] text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-[#002045]/20"
          >
            {t.nav.postHouse}
          </Link>

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
                  <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,32,69,0.12)] border border-[#eef0f2] overflow-hidden z-50">
                    <div className="p-2">
                      <Link
                        href={dashboardHref}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f7f9fb] transition-colors text-sm font-bold text-[#002045]"
                      >
                        <span className="material-symbols-outlined text-lg text-[#845326]">dashboard</span>
                        Dashboard
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
          {navLinkKeys.map((link) => {
            // Properties expands into the listing categories
            if (link.key === 'properties') {
              const activeType = searchParams.get('type') || '';
              return (
                <div key={link.href} className="py-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#74777f] pt-3 pb-1">
                    {t.nav.properties}
                  </p>
                  <div className="border-l-2 border-[#f2f4f6] pl-3 space-y-1">
                    {propertyCategories.map((cat) => {
                      const isCatActive = pathname === '/properties' && activeType === cat.type;
                      return (
                        <Link
                          key={cat.key}
                          href={categoryHref(cat.type)}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 font-bold text-base py-2 transition-colors ${
                            isCatActive ? 'text-[#845326]' : 'text-[#002045] hover:text-[#845326]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg text-[#845326]">{cat.icon}</span>
                          {t.nav[cat.key]}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block font-bold text-[#002045] text-base py-2 hover:text-[#845326] transition-colors"
              >
                {t.nav[link.key]}
              </Link>
            );
          })}
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
            className="mt-2 block text-center bg-[#002045] text-white px-4 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-all font-headline"
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
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 font-bold text-[#002045] text-sm py-2"
                >
                  <span className="material-symbols-outlined text-lg text-[#845326]">dashboard</span>
                  Dashboard
                </Link>
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
