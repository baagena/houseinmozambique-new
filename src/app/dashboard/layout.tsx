'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import ThemeSwitch from '@/components/dashboard/ThemeSwitch';
import { logout } from '@/lib/auth';

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
      {/* Console typefaces. Rendered here rather than in the root layout so the
          public marketing pages do not pay for fonts only the console uses;
          React hoists these into <head>. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
      />
      <DashboardSidebar role={roleLabel as 'admin' | 'agent'} userName={user.name} accountRole={user.role} />

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Top Header */}
        <header
          className="sticky top-0 z-10 px-6 h-14 flex justify-between items-center backdrop-blur-xl"
          style={{
            background: 'color-mix(in srgb, var(--d-card) 85%, transparent)',
            borderBottom: '1px solid var(--d-border)',
          }}
        >
          <div
            className="flex items-center gap-2.5 px-3 h-9 w-72 max-w-[40vw] transition-colors"
            style={{
              background: 'var(--d-border-soft)',
              borderRadius: 'var(--d-radius-sm)',
              border: '1px solid transparent',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 19, color: 'var(--d-text-3)' }}
              aria-hidden="true"
            >
              search
            </span>
            <label htmlFor="dash-search" className="sr-only">Search listings, leads and agents</label>
            <input
              id="dash-search"
              type="text"
              placeholder="Search listings, leads, agents…"
              className="bg-transparent border-none outline-none w-full"
              style={{ fontSize: 'var(--d-fs-base)', fontWeight: 500, color: 'var(--d-text-1)' }}
            />
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitch />

            <Link
              href="/dashboard/notifications"
              className="relative p-2 flex items-center justify-center transition-colors"
              style={{ borderRadius: 'var(--d-radius-sm)', color: 'var(--d-text-3)' }}
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 21 }} aria-hidden="true">
                notifications
              </span>
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--d-crit)', boxShadow: '0 0 0 2px var(--d-card)' }}
              />
            </Link>

            <div style={{ height: 24, width: 1, background: 'var(--d-border)' }} />

            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block leading-tight">
                <p style={{ fontSize: 'var(--d-fs-sm)', fontWeight: 600, color: 'var(--d-text-1)', margin: 0 }}>
                  {user.name}
                </p>
                <p className="eyebrow" style={{ margin: 0 }}>{roleLabel}</p>
              </div>
              <div
                className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: 'var(--d-radius-sm)', background: 'var(--d-ink)' }}
              >
                <span style={{ fontSize: 'var(--d-fs-label)', fontWeight: 700, color: 'var(--d-gold)' }}>
                  {user.initials}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Sign out"
                className="p-2 transition-colors disabled:opacity-50"
                style={{ borderRadius: 'var(--d-radius-sm)', color: 'var(--d-text-3)' }}
              >
                {isLoggingOut ? (
                  <span
                    className="block w-[18px] h-[18px] rounded-full animate-spin"
                    style={{
                      border: '2px solid color-mix(in srgb, var(--d-text-3) 30%, transparent)',
                      borderTopColor: 'var(--d-text-3)',
                    }}
                  />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: 19 }} aria-hidden="true">
                    logout
                  </span>
                )}
                <span className="sr-only">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 lg:px-8 lg:py-8 max-w-[1400px]">
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
