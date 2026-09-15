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
  { label: 'Subscribers', href: '/dashboard/admin/subscribers', icon: 'group_add' },
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
    <aside
      className="w-60 h-full flex flex-col relative z-20 overflow-y-auto custom-scrollbar"
      style={{ background: 'var(--d-card)', borderRight: '1px solid var(--d-border)' }}
    >
      {/* Branding */}
      <div className="px-5 pt-5 pb-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="relative w-8 h-8 overflow-hidden"
            style={{
              borderRadius: 'var(--d-radius-sm)',
              background: 'var(--d-border-soft)',
              border: '1px solid var(--d-border)',
            }}
          >
            <Image src="/logo.png" alt="House in Mozambique" fill className="object-contain" />
          </div>
          <div className="leading-tight">
            <p
              className="display"
              style={{ fontSize: 'var(--d-fs-base)', fontWeight: 600, color: 'var(--d-text-1)', margin: 0 }}
            >
              House in Mozambique
            </p>
            <p className="eyebrow" style={{ margin: 0 }}>{workspaceLabel} workspace</p>
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="eyebrow px-3 pb-2 pt-1">Menu</p>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className="flex items-center gap-3 px-3 py-2 transition-colors duration-150"
              style={{
                borderRadius: 'var(--d-radius-sm)',
                background: isActive ? 'var(--d-ink)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--d-text-2)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: isActive ? 'var(--d-gold)' : 'var(--d-text-3)' }}
                aria-hidden="true"
              >
                {link.icon}
              </span>
              <span style={{ fontSize: 'var(--d-fs-base)', fontWeight: 500 }}>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="px-3 py-3 mt-auto" style={{ borderTop: '1px solid var(--d-border)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2" style={{ borderRadius: 'var(--d-radius-sm)' }}>
          <div
            className="w-8 h-8 flex items-center justify-center font-semibold"
            style={{
              borderRadius: 'var(--d-radius-sm)',
              background: 'var(--d-ink)',
              color: 'var(--d-gold)',
              fontSize: 'var(--d-fs-label)',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 overflow-hidden leading-tight">
            <p
              className="truncate"
              style={{ fontSize: 'var(--d-fs-sm)', fontWeight: 600, color: 'var(--d-text-1)', margin: 0 }}
            >
              {userName}
            </p>
            <p
              className="truncate"
              style={{ fontSize: 'var(--d-fs-label)', color: 'var(--d-text-3)', margin: 0 }}
            >
              {roleCaption}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 transition-colors"
            style={{ borderRadius: 6, color: 'var(--d-text-3)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">logout</span>
            <span className="sr-only">Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
