'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { logout } from '@/lib/auth';
import { useLanguage } from '@/components/i18n/LanguageContext';

type NavKey = 'home' | 'properties' | 'agents' | 'services' | 'about' | 'news' | 'contact';

const navLinks: Array<{ href: string; key: NavKey }> = [
  { href: '/', key: 'home' },
  { href: '/properties', key: 'properties' },
  { href: '/agents', key: 'agents' },
  { href: '/services', key: 'services' },
  { href: '/about', key: 'about' },
  { href: '/news', key: 'news' },
  { href: '/contact', key: 'contact' },
];

/** Listing-type shortcuts. `type` matches Property.listingType in the database. */
const propertyCategories: Array<{ type: string; key: string; descKey: string; icon: string }> = [
  { type: 'Buy', key: 'forSale', descKey: 'forSaleDesc', icon: 'sell' },
  { type: 'Rent', key: 'forRent', descKey: 'forRentDesc', icon: 'vpn_key' },
  { type: 'Short Stay', key: 'shortStays', descKey: 'shortStaysDesc', icon: 'weekend' },
  { type: 'Auction', key: 'auctions', descKey: 'auctionsDesc', icon: 'gavel' },
  { type: '', key: 'allProperties', descKey: 'allPropertiesDesc', icon: 'grid_view' },
];

const categoryHref = (type: string) =>
  type ? `/properties?type=${encodeURIComponent(type)}` : '/properties';

interface TopAd {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  position: string;
  bgColor?: string | null;
  textColor?: string | null;
}

function trackClick(id: string) {
  fetch(`/api/admin/ads/${id}/click`, { method: 'POST' }).catch(() => {});
}

/**
 * The banner slot that lives in the white brand bar. Falls back to a house ad
 * so the slot is never an empty grey box.
 */
function TopbarAd({ ad }: { ad: TopAd | null }) {
  if (!ad) {
    return (
      <Link href="/pricing" className="topbar__ad" aria-label="Advertise with House in Mozambique">
        <span className="ad__label">Advertisement</span>
        <span className="flex h-full items-center gap-3 px-4">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-[var(--gold)] text-[var(--ink-deep)]">
            <span className="material-symbols-outlined text-[20px]">campaign</span>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.82rem] font-semibold text-[var(--ink)]">
              Advertise here
            </span>
            <span className="mono block truncate text-[0.66rem] text-[var(--hm-muted)]">
              Reach buyers across Mozambique →
            </span>
          </span>
        </span>
      </Link>
    );
  }

  const inner = (
    <>
      <span className="ad__label">Advertisement</span>
      {ad.imageUrl ? (
        <img src={ad.imageUrl} alt={ad.title} />
      ) : (
        <span
          className="flex h-full items-center px-4"
          style={{ background: ad.bgColor || 'var(--ink)' }}
        >
          <span className="min-w-0">
            <span
              className="block truncate text-[0.86rem] font-semibold"
              style={{ color: ad.textColor || '#fff' }}
            >
              {ad.title}
            </span>
            {ad.description && (
              <span
                className="block truncate text-[0.72rem] opacity-75"
                style={{ color: ad.textColor || '#fff' }}
              >
                {ad.description}
              </span>
            )}
          </span>
        </span>
      )}
    </>
  );

  if (!ad.linkUrl) return <div className="topbar__ad">{inner}</div>;

  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackClick(ad.id)}
      className="topbar__ad"
    >
      {inner}
    </a>
  );
}

function SiteHeaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePropsOpen, setMobilePropsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('AGENT');
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [topAd, setTopAd] = useState<TopAd | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Auth state from the server session
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
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  // The header banner slot is a real ad zone, filled from the same DB table.
  useEffect(() => {
    let mounted = true;
    fetch('/api/ads')
      .then((res) => (res.ok ? res.json() : []))
      .then((ads: TopAd[]) => {
        if (!mounted || !Array.isArray(ads)) return;
        const slot = ads.filter((a) => a.position === 'top_banner');
        if (slot.length) setTopAd(slot[Math.floor(Math.random() * slot.length)]);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Close menus on outside click / Escape
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) setCategoriesOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAccountOpen(false);
        setCategoriesOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    setCategoriesOpen(false);
    setMobileOpen(false);
  }, [pathname, searchParams]);

  // The mobile sheet takes over the viewport — stop the page behind it scrolling.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    await logout();
    setIsLoggedIn(false);
    setUserRole('AGENT');
    setAccountOpen(false);
    setMobileOpen(false);
    router.push('/');
  };

  const userInitials =
    userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';
  const dashboardHref = userRole === 'ADMIN' ? '/dashboard/admin' : '/dashboard/agent';
  const activeType = searchParams.get('type') || '';

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  return (
    <>
      {/* ── Brand + ad bar (white, scrolls away) ── */}
      <div className="topbar">
        <div className="wrap topbar__in">
          <Link href="/" className="brand" aria-label="House in Mozambique — home">
            <span className="relative block h-10 w-10 flex-none">
              <Image src="/logo.png" alt="" fill className="object-contain" sizes="40px" />
            </span>
            <span className="leading-tight">
              <span className="block text-[1.02rem] tracking-tight">House in Mozambique</span>
              <small>PROPERTY MARKETPLACE</small>
            </span>
          </Link>

          <TopbarAd ad={topAd} />

          <button
            className="topbar__ham"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <span className="material-symbols-outlined text-[1.7rem]">menu</span>
          </button>
        </div>
      </div>

      {/* ── Navy nav bar (sticky) ── */}
      <header className="site-header">
        <div className="wrap">
          <nav className="nav">
            {navLinks.map((link) => {
              if (link.key === 'properties') {
                return (
                  <div key={link.href} ref={categoriesRef} className="relative">
                    <button
                      onClick={() => setCategoriesOpen((o) => !o)}
                      aria-expanded={categoriesOpen}
                      aria-haspopup="true"
                      data-active={isActive('/properties') ? 'true' : undefined}
                    >
                      {t.nav.properties}
                      <span
                        className={`material-symbols-outlined text-[1rem] transition-transform ${
                          categoriesOpen ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </button>

                    {categoriesOpen && (
                      <div className="navmenu">
                        {propertyCategories.map((cat) => (
                          <Link
                            key={cat.key}
                            href={categoryHref(cat.type)}
                            onClick={() => setCategoriesOpen(false)}
                            style={
                              pathname === '/properties' && activeType === cat.type
                                ? { background: 'var(--paper)' }
                                : undefined
                            }
                          >
                            <span className="material-symbols-outlined ic text-[1.1rem]">{cat.icon}</span>
                            <span>
                              <span className="t">{t.nav[cat.key]}</span>
                              <span className="d">{t.nav[cat.descKey]}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {t.nav[link.key]}
                </Link>
              );
            })}
          </nav>

          <div className="header-actions">
            <Link href="/pricing" className="btn btn--gold btn--sm">
              {t.nav.postHouse}
            </Link>

            {!isLoggedIn && (
              <Link href="/auth" className="btn btn--ghost-l btn--sm">
                {t.nav.signIn}
              </Link>
            )}

            <span className="h-div" aria-hidden="true" />

            <div className="langtog">
              <button onClick={() => setLang('en')} className={lang === 'en' ? 'on' : ''} aria-label="English">
                EN
              </button>
              <span className="sep">/</span>
              <button onClick={() => setLang('pt')} className={lang === 'pt' ? 'on' : ''} aria-label="Português">
                PT
              </button>
            </div>

            {isLoggedIn && (
              <div className="relative" ref={accountRef}>
                <button
                  className="avatar"
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  {userInitials}
                </button>
                {accountOpen && (
                  <div className="navmenu navmenu--right">
                    <Link href={dashboardHref} onClick={() => setAccountOpen(false)}>
                      <span className="material-symbols-outlined ic text-[1.1rem]">dashboard</span>
                      <span className="t">Dashboard</span>
                    </Link>
                    <button onClick={handleSignOut}>
                      <span className="material-symbols-outlined ic text-[1.1rem]">logout</span>
                      <span className="t">{t.auth.signOut}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile menu sheet ── */}
      <div className={`mnav${mobileOpen ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="mnav__close">
          <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
            <span className="relative block h-9 w-9 flex-none">
              <Image src="/logo.png" alt="" fill className="object-contain" sizes="36px" />
            </span>
            <span className="leading-tight">
              <span className="block text-[0.98rem]">House in Mozambique</span>
              <small>PROPERTY MARKETPLACE</small>
            </span>
          </Link>
          <button className="x" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <span className="material-symbols-outlined text-[1.8rem]">close</span>
          </button>
        </div>

        {navLinks.map((link) => {
          if (link.key === 'properties') {
            return (
              <div key={link.href}>
                <button
                  className="mlink flex items-center justify-between"
                  onClick={() => setMobilePropsOpen((o) => !o)}
                  aria-expanded={mobilePropsOpen}
                >
                  {t.nav.properties}
                  <span
                    className={`material-symbols-outlined transition-transform ${
                      mobilePropsOpen ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {mobilePropsOpen && (
                  <div className="msub">
                    {propertyCategories.map((cat) => (
                      <Link key={cat.key} href={categoryHref(cat.type)} onClick={() => setMobileOpen(false)}>
                        {t.nav[cat.key]}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link key={link.href} href={link.href} className="mlink" onClick={() => setMobileOpen(false)}>
              {t.nav[link.key]}
            </Link>
          );
        })}

        <div className="mcta">
          <Link href="/pricing" className="btn btn--gold" onClick={() => setMobileOpen(false)}>
            {t.nav.postHouse}
          </Link>
          {isLoggedIn ? (
            <Link href={dashboardHref} className="btn btn--ghost-l" onClick={() => setMobileOpen(false)}>
              Dashboard
            </Link>
          ) : (
            <Link href="/auth" className="btn btn--ghost-l" onClick={() => setMobileOpen(false)}>
              {t.nav.signIn}
            </Link>
          )}
        </div>

        <div className="mfoot">
          <div className="langtog">
            <button onClick={() => setLang('en')} className={lang === 'en' ? 'on' : ''}>
              EN
            </button>
            <span className="sep">/</span>
            <button onClick={() => setLang('pt')} className={lang === 'pt' ? 'on' : ''}>
              PT
            </button>
          </div>
          {isLoggedIn && (
            <button
              onClick={handleSignOut}
              className="mono text-[0.78rem] text-[rgba(255,255,255,.6)] hover:text-[var(--gold)]"
            >
              {t.auth.signOut}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function SiteHeader() {
  return (
    <Suspense fallback={null}>
      <SiteHeaderContent />
    </Suspense>
  );
}
