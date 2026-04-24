'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

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
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
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
      <DashboardSidebar role={roleLabel as 'admin' | 'agent'} userName={user.name} />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#f2f4f6] px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 bg-[#f7f9fb] px-4 py-2.5 rounded-2xl w-96 group border border-transparent focus-within:border-[#002045]/10 focus-within:bg-white transition-all">
            <span className="material-symbols-outlined text-[#74777f]">search</span>
            <input 
              type="text" 
              placeholder="Search listings, leads, or agents..." 
              className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder-[#c4c6cf]"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard/notifications"
              className="relative p-2 text-[#74777f] hover:text-[#002045] transition-colors group flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </Link>
            <div className="h-8 w-px bg-[#f2f4f6]" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-[#002045] leading-none mb-1">{user.name}</p>
                <p className="text-[9px] font-bold text-[#74777f] uppercase tracking-widest leading-none">{roleLabel}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#002045] to-[#1a365d] flex items-center justify-center border border-white/10 shadow-lg">
                <span className="text-[10px] font-bold text-[#fab983] tracking-widest">{user.initials}</span>
              </div>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Sign Out"
                className="p-2 rounded-xl text-[#74777f] hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <div className="w-5 h-5 border-2 border-[#74777f]/30 border-t-[#74777f] rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-xl">logout</span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-[#002045]/10 border-t-[#002045] rounded-full animate-spin" /></div>}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
