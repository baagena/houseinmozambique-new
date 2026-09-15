'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { logout } from '@/lib/auth';
import Icon from '@/components/ui/Icon';

interface SidebarLink {
  label: string;
  href: string;
  icon: string;
}

/**
 * Admin has eleven destinations. As one flat list they read as an inventory
 * rather than a tool, so they are grouped by the job you came to do. The first
 * group carries no heading — the overview is the landing place, not a category.
 */
interface SidebarGroup {
  label?: string;
  links: SidebarLink[];
}

interface DashboardSidebarProps {
  role: 'admin' | 'agent';
  userName: string;
  /** Raw account role, so a private owner is not labelled as an agent. */
  accountRole?: string;
}

const AGENT_GROUPS: SidebarGroup[] = [
  { links: [{ label: 'Overview', href: '/dashboard/agent', icon: 'dashboard' }] },
  {
    label: 'Listings',
    links: [
      { label: 'Compose listing', href: '/dashboard/agent/compose', icon: 'edit_note' },
      { label: 'My listings', href: '/dashboard/agent/listings', icon: 'home_work' },
      { label: 'Leads & inquiries', href: '/dashboard/agent/leads', icon: 'chat_bubble' },
    ],
  },
  {
    label: 'Account',
    links: [
      { label: 'My profile', href: '/dashboard/agent/profile', icon: 'person_edit' },
      { label: 'Settings', href: '/dashboard/agent/settings', icon: 'settings' },
    ],
  },
];

const ADMIN_GROUPS: SidebarGroup[] = [
  { links: [{ label: 'Hub overview', href: '/dashboard/admin', icon: 'analytics' }] },
  {
    label: 'Listings',
    links: [
      { label: 'All properties', href: '/dashboard/admin/properties', icon: 'domain' },
      { label: 'Approvals', href: '/dashboard/admin/approvals', icon: 'verified' },
      { label: 'Manage agents', href: '/dashboard/admin/agents', icon: 'group' },
    ],
  },
  {
    label: 'Audience',
    links: [
      { label: 'Contact messages', href: '/dashboard/admin/activities', icon: 'mail' },
      { label: 'Subscribers', href: '/dashboard/admin/subscribers', icon: 'group_add' },
      { label: 'Advertisements', href: '/dashboard/admin/ads', icon: 'campaign' },
    ],
  },
  {
    label: 'Content & setup',
    links: [
      { label: 'Blog', href: '/dashboard/admin/blog', icon: 'article' },
      { label: 'Edit pages', href: '/dashboard/admin/content', icon: 'edit_document' },
      { label: 'Pricing plans', href: '/dashboard/admin/pricing', icon: 'sell' },
      { label: 'System settings', href: '/dashboard/admin/settings', icon: 'tune' },
    ],
  },
];

export default function DashboardSidebar({ role, userName, accountRole }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = role === 'admin' ? ADMIN_GROUPS : AGENT_GROUPS;
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
      style={{ background: 'var(--d-nav-bg)', borderRight: '1px solid var(--d-nav-line)' }}
    >
      {/* Branding */}
      <div className="px-5 pt-5 pb-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="relative w-8 h-8 overflow-hidden flex-none"
            style={{
              borderRadius: 'var(--d-radius-sm)',
              background: '#ffffff',
              border: '1px solid var(--d-nav-line)',
            }}
          >
            <Image src="/logo.png" alt="House in Mozambique" fill className="object-contain" />
          </div>
          <div className="leading-tight min-w-0">
            <p
              className="display truncate"
              style={{ fontSize: 'var(--d-fs-base)', fontWeight: 600, color: '#ffffff', margin: 0 }}
            >
              House in Mozambique
            </p>
            <p
              style={{
                fontSize: 'var(--d-fs-label)',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: 'var(--d-nav-label)',
                margin: '2px 0 0',
              }}
            >
              {workspaceLabel} workspace
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-3">
        {groups.map((group, gi) => (
          <div key={group.label ?? `group-${gi}`}>
            {group.label && (
              <p
                style={{
                  fontSize: 'var(--d-fs-label)',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: 'var(--d-nav-label)',
                  margin: 0,
                  padding: '16px 12px 6px',
                }}
              >
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className="flex items-center gap-3 px-3 py-2 transition-colors duration-150"
                    style={{
                      borderRadius: 'var(--d-radius-sm)',
                      background: isActive ? 'rgba(255,255,255,.10)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--d-nav-idle)',
                      fontWeight: isActive ? 600 : 500,
                      boxShadow: isActive ? 'inset 2px 0 0 var(--d-gold)' : undefined,
                    }}
                  >
                    <Icon
                      name={link.icon}
                      style={{ color: isActive ? 'var(--d-gold)' : 'var(--d-nav-label)' }}
                    />
                    <span style={{ fontSize: 'var(--d-fs-base)' }}>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Profile */}
      <div className="px-3 py-3 mt-auto" style={{ borderTop: '1px solid var(--d-nav-line)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2" style={{ borderRadius: 'var(--d-radius-sm)' }}>
          <div
            className="w-8 h-8 flex items-center justify-center font-semibold flex-none"
            style={{
              borderRadius: '50%',
              background: 'rgba(255,255,255,.12)',
              color: 'var(--d-gold)',
              fontSize: 'var(--d-fs-label)',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 overflow-hidden leading-tight">
            <p
              className="truncate"
              style={{ fontSize: 'var(--d-fs-sm)', fontWeight: 600, color: '#ffffff', margin: 0 }}
            >
              {userName}
            </p>
            <p
              className="truncate"
              style={{ fontSize: 'var(--d-fs-label)', color: 'var(--d-nav-label)', margin: 0 }}
            >
              {roleCaption}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 transition-colors"
            style={{ borderRadius: 6, color: 'var(--d-nav-label)' }}
          >
            <Icon name="logout" size={18} />
            <span className="sr-only">Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
