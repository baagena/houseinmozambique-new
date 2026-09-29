'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import ThemeSwitch from '@/components/dashboard/ThemeSwitch';
import LanguageSwitch from '@/components/dashboard/LanguageSwitch';
import { logout } from '@/lib/auth';
import Icon from '@/components/ui/Icon';

interface SessionUser {
  id: string;
  name: string;
  initials: string;
  role: string;
  email: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /* Phones: the sidebar is a drawer. Any navigation closes it, adjusted during
     render (as the sidebar does for its own state) so the next page never
     paints with the drawer still over it. */
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [navPath, setNavPath] = useState(pathname);
  if (pathname !== navPath) {
    setNavPath(pathname);
    setNavOpen(false);
  }
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthenticated');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) router.push('/auth');
      });
    return () => { cancelled = true; };
  }, [router]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push('/auth');
    }
  }, [router]);

  if (!user) {
    return (
      <div
        className="him-dash min-h-screen flex items-center justify-center"
        style={{ background: 'var(--d-ink)' }}
      >
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{
            border: '4px solid color-mix(in srgb, var(--d-gold) 30%, transparent)',
            borderTopColor: 'var(--d-gold)',
          }}
        />
        <span className="sr-only">Loading your workspace…</span>
      </div>
    );
  }

  const roleLabel = user.role === 'ADMIN' ? 'admin' : 'agent';

  return (
    <div
      className="him-dash flex h-screen overflow-hidden"
      style={{ background: 'var(--d-paper)' }}
    >
      {/* Typefaces are self-hosted via next/font — see src/app/fonts.ts. They
          used to be a render-blocking <link> to fonts.googleapis.com right
          here, which cost a third-party round trip before the console could
          paint. */}
      <DashboardSidebar
        role={roleLabel as 'admin' | 'agent'}
        userName={user.name}
        accountRole={user.role}
        mobileOpen={navOpen}
        onNavigate={() => setNavOpen(false)}
      />
      <div
        className={`dash-backdrop${navOpen ? ' is-open' : ''}`}
        onClick={() => setNavOpen(false)}
        aria-hidden="true"
      />

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Topbar — classes from the design package's ops-console-preview.html.
            The signed-in identity lives HERE, not in the sidebar foot. */}
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={navOpen}
          >
            <Icon name="menu" size={20} />
          </button>
          <div className="search">
            <Icon name="search" size={15} />
            <label htmlFor="dash-search" className="sr-only">Search listings, leads and agents</label>
            <input
              id="dash-search"
              type="text"
              placeholder="Search listings, leads, agents…"
            />
          </div>

          <div className="topbar-right">
            <LanguageSwitch />
            <ThemeSwitch />

            <Link
              href="/dashboard/notifications"
              className="icon-btn"
              aria-label="Notifications"
            >
              <Icon name="notifications" size={18} />
              <span className="dot" />
            </Link>

            <div className="who-chip">
              <div className="leading-tight" style={{ textAlign: 'right' }}>
                <div className="who-name">{user.name}</div>
                <div className="who-role">{user.role === 'ADMIN' ? 'Administrator' : 'Agent'}</div>
              </div>
              <div className="avatar-sm">{user.initials}</div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Sign out"
                className="icon-btn"
                aria-label="Sign out"
              >
                <Icon name="logout" size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className="content">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div
                  className="w-7 h-7 rounded-full animate-spin"
                  style={{
                    border: '3px solid var(--d-border)',
                    borderTopColor: 'var(--d-ink)',
                  }}
                />
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
