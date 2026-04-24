'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarLink {
  label: string;
  href: string;
  icon: string;
}

interface DashboardSidebarProps {
  role: 'admin' | 'agent';
  userName: string;
}

const AGENT_LINKS: SidebarLink[] = [
  { label: 'Overview', href: '/dashboard/agent', icon: 'dashboard' },
  { label: 'My Listings', href: '/dashboard/agent/listings', icon: 'home_work' },
  { label: 'Leads & Inquiries', href: '/dashboard/agent/leads', icon: 'chat_bubble' },
  { label: 'My Profile', href: '/dashboard/agent/profile', icon: 'person_edit' },
  { label: 'Settings', href: '/dashboard/agent/settings', icon: 'settings' },
];

const ADMIN_LINKS: SidebarLink[] = [
  { label: 'Hub Overview', href: '/dashboard/admin', icon: 'analytics' },
  { label: 'Manage Agents', href: '/dashboard/admin/agents', icon: 'group' },
  { label: 'All Properties', href: '/dashboard/admin/properties', icon: 'domain' },
  { label: 'Approvals', href: '/dashboard/admin/approvals', icon: 'verified' },
  { label: 'System Settings', href: '/dashboard/admin/settings', icon: 'tune' },
];

export default function DashboardSidebar({ role, userName }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const links = role === 'admin' ? ADMIN_LINKS : AGENT_LINKS;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      router.push('/auth');
    }
  };

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || (role === 'admin' ? 'AD' : 'AG');

  return (
    <aside className="w-80 h-full flex flex-col bg-white border-r border-[#f2f4f6] relative z-20 overflow-y-auto custom-scrollbar">
      {/* Branding */}
      <div className="p-8 pb-12">
        <Link href="/" className="text-2xl font-black text-[#002045] tracking-tighter block mb-1" style={{ fontFamily: 'var(--font-headline)' }}>
          HIM.
          <span className="text-[#fab983] ml-0.5">Control</span>
        </Link>
        <p className="text-[10px] font-bold text-[#c4c6cf] uppercase tracking-widest">{role} dashboard</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${isActive ? 'bg-[#002045] text-white shadow-xl shadow-[#002045]/10' : 'text-[#74777f] hover:bg-[#f7f9fb] hover:text-[#002045]'}`}
            >
              <span className={`material-symbols-outlined text-2xl transition-transform group-hover:scale-110 ${isActive ? 'text-[#fab983]' : 'text-inherit'}`}>
                {link.icon}
              </span>
              <span className="text-sm font-black tracking-tight">{link.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#fab983]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="p-6 mt-auto border-t border-[#f2f4f6]">
        <div className="bg-[#f7f9fb] rounded-3xl p-4 flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#002045] flex items-center justify-center text-white font-black text-xs translate-x-[0.5px]">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-black text-[#002045] truncate">{userName}</p>
            <p className="text-[9px] font-bold text-[#74777f] uppercase tracking-widest truncate">{role === 'admin' ? 'Master Access' : 'Verified Agent'}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
