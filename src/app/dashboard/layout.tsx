'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
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
      <div className="min-h-screen flex items-center justify-center bg-[#002045]">
        <div className="w-12 h-12 border-4 border-[#fab983]/30 border-t-[#fab983] rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel = user.role === 'ADMIN' ? 'admin' : 'agent';

  return (
    <div className="flex h-screen bg-[#f7f9fb] overflow-hidden">
      <DashboardSidebar role={roleLabel as 'admin' | 'agent'} userName={user.name} accountRole={user.role} />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-xl border-b border-[#eceef1] px-6 h-14 flex justify-between items-center">
          <div className="flex items-center gap-2.5 bg-[#f5f6f8] px-3 h-9 rounded-lg w-72 max-w-[40vw] border border-transparent focus-within:border-[#002045]/15 focus-within:bg-white transition-colors">
            <span className="material-symbols-outlined text-[19px] text-[#9aa0a8]">search</span>
            <input
              type="text"
              placeholder="Search listings, leads, agents…"
              className="bg-transparent border-none outline-none text-[13px] font-medium w-full text-[#3f4754] placeholder-[#b4b9c0]"
            />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-lg text-[#9aa0a8] hover:text-[#002045] hover:bg-[#f5f6f8] transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[21px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
            </Link>
            <div className="h-6 w-px bg-[#eceef1]" />
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block leading-tight">
                <p className="text-[12px] font-semibold text-[#002045]">{user.name}</p>
                <p className="text-[11px] font-medium text-[#9aa0a8] capitalize">{roleLabel}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#002045] flex items-center justify-center">
                <span className="text-[11px] font-semibold text-[#fab983]">{user.initials}</span>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Sign out"
                className="p-2 rounded-lg text-[#9aa0a8] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <div className="w-[18px] h-[18px] border-2 border-[#9aa0a8]/30 border-t-[#9aa0a8] rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[19px]">logout</span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 lg:px-8 lg:py-8 max-w-[1400px]">
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-7 h-7 border-[3px] border-[#002045]/15 border-t-[#002045] rounded-full animate-spin" /></div>}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
