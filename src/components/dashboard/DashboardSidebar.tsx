'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { logout } from '@/lib/auth';

interface SidebarLink {
  label: string;
  href: string;
  icon: string;
}

interface DashboardSidebarProps {
  role: 'admin' | 'agent';
  userName: string;
  /** Raw account role, so a private owner is not labelled as an agent. */
  accountRole?: string;
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
  { label: 'Contact Messages', href: '/dashboard/admin/activities', icon: 'mail' },
  { label: 'Blog', href: '/dashboard/admin/blog', icon: 'article' },
  { label: 'All Properties', href: '/dashboard/admin/properties', icon: 'domain' },
  { label: 'Approvals', href: '/dashboard/admin/approvals', icon: 'verified' },
  { label: 'Edit Pages', href: '/dashboard/admin/content', icon: 'edit_document' },
  { label: 'Pricing Plans', href: '/dashboard/admin/pricing', icon: 'sell' },
  { label: 'Advertisements', href: '/dashboard/admin/ads', icon: 'campaign' },
  { label: 'System Settings', href: '/dashboard/admin/settings', icon: 'tune' },
];

export default function DashboardSidebar({ role, userName, accountRole }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const links = role === 'admin' ? ADMIN_LINKS : AGENT_LINKS;
  const isOwner = accountRole === 'OWNER';
  const workspaceLabel = role === 'admin' ? 'admin' : isOwner ? 'owner' : 'agent';
  const roleCaption = role === 'admin' ? 'Administrator' : isOwner ? 'Property owner' : 'Verified agent';

  const handleLogout = async () => {
    try {
      await logout();
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
    <aside className="w-60 h-full flex flex-col bg-white border-r border-[#eceef1] relative z-20 overflow-y-auto custom-scrollbar">
      {/* Branding */}
      <div className="px-5 pt-5 pb-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#f5f6f8] border border-[#eceef1]">
            <Image src="/logo.png" alt="House in Mozambique" fill className="object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-[#002045] tracking-tight">House in Mozambique</p>
            <p className="text-[11px] font-medium text-[#9aa0a8] capitalize">{workspaceLabel} workspace</p>
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[#b4b9c0]">Menu</p>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group ${isActive ? 'bg-[#002045] text-white' : 'text-[#5b616b] hover:bg-[#f5f6f8] hover:text-[#002045]'}`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#fab983]' : 'text-[#9aa0a8] group-hover:text-[#002045]'}`}>
                {link.icon}
              </span>
              <span className="text-[13px] font-medium tracking-tight">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="px-3 py-3 mt-auto border-t border-[#eceef1]">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="w-8 h-8 rounded-lg bg-[#002045] flex items-center justify-center text-white font-semibold text-[11px]">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden leading-tight">
            <p className="text-[12px] font-semibold text-[#002045] truncate">{userName}</p>
            <p className="text-[11px] font-medium text-[#9aa0a8] truncate">{roleCaption}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-md text-[#9aa0a8] hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
