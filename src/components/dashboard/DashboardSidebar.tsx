'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import Icon from '@/components/ui/Icon';
import type { NavCounts } from '@/app/api/dashboard/nav-counts/route';

/**
 * The console sidebar.
 *
 * Markup and classes come straight from the design package's
 * ops-console-preview.html — .sidebar / .brand / .ws-switch / .nav-item /
 * .nav-count / .sidebar-foot — with the styling living in dashboard-ui.css.
 * Nothing here re-invents geometry or colour; if something looks wrong, the
 * preview is the thing to check, not this file.
 *
 * No identity block in the footer: in the reference the signed-in user lives in
 * the TOPBAR, and the sidebar foot carries only "View storefront" and
 * "Sign out". No workspace switcher either — an admin reaches the agent side
 * through its own routes, and the control only invited confusion.
 *
 * The NAV owns the vertical scroll, not the <aside>. With the scroll on the
 * aside, a long list ran underneath .sidebar-foot, which margin-top:auto pins
 * to the bottom.
 *
 * Only routes that EXIST are listed. Still missing from the reference: Verify
 * payments, Listing quality, SEO & pages, Listing standards, Documents, Support
 * cases and Audit log. Each needs a model from the design package's migration
 * (PropertyPhoto, AgentDocument, SupportCase, AuditEvent, LandingPage), so they
 * appear once that lands. A nav row pointing at a 404 is worse than an absent
 * one.
 */

interface SidebarLink {
  label: string;
  href: string;
  icon: string;
  /** Key into the counts payload. Absent means this row never shows a badge. */
  count?: keyof NavCounts;
}

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
  {
    label: 'My business',
    links: [
      { label: 'New listing', href: '/dashboard/agent/new', icon: 'add' },
      { label: 'Overview', href: '/dashboard/agent', icon: 'dashboard' },
      { label: 'My listings', href: '/dashboard/agent/listings', icon: 'home_work', count: 'myListings' },
      { label: 'My leads', href: '/dashboard/agent/leads', icon: 'chat_bubble', count: 'myLeads' },
      /* Buyers who have said what they want. Above Billing on purpose: it is
         the thing a subscription buys, so it should be visible to somebody
         deciding whether to renew one. */
      { label: 'Buyers looking', href: '/dashboard/agent/requests', icon: 'group', count: 'openRequests' },
    ],
  },
  {
    label: 'Account',
    links: [
      { label: 'Billing', href: '/dashboard/agent/billing', icon: 'payments' },
      { label: 'My profile', href: '/dashboard/agent/profile', icon: 'person_edit' },
      { label: 'Settings', href: '/dashboard/agent/settings', icon: 'settings' },
    ],
  },
];

const ADMIN_GROUPS: SidebarGroup[] = [
  {
    label: 'Marketplace',
    links: [
      { label: 'Overview', href: '/dashboard/admin', icon: 'dashboard' },
      { label: 'Properties', href: '/dashboard/admin/properties', icon: 'home_work', count: 'properties' },
      { label: 'Agents', href: '/dashboard/admin/agents', icon: 'group' },
      { label: 'Approvals', href: '/dashboard/admin/approvals', icon: 'check_circle', count: 'approvals' },
      { label: 'Leads', href: '/dashboard/admin/leads', icon: 'chat_bubble', count: 'messages' },
      { label: 'Property requests', href: '/dashboard/admin/requests', icon: 'group', count: 'requestsToRelease' },
    ],
  },
  {
    label: 'Money',
    links: [
      /* Above the ledger on purpose: the queue is work waiting, the ledger is
         a record. The badge counts submitted proofs only — a reference nobody
         has paid yet is not something an admin can act on. */
      { label: 'Verify payments', href: '/dashboard/admin/payments/verify', icon: 'inbox', count: 'paymentsToVerify' },
      { label: 'Payments ledger', href: '/dashboard/admin/payments', icon: 'payments', count: 'payments' },
      { label: 'Pricing plans', href: '/dashboard/admin/pricing', icon: 'sell' },
    ],
  },
  {
    label: 'Inbox & trust',
    links: [
      { label: 'Contact messages', href: '/dashboard/admin/activities', icon: 'mail' },
      { label: 'Notifications', href: '/dashboard/notifications', icon: 'notifications' },
    ],
  },
  {
    label: 'Content',
    links: [
      { label: 'Blog', href: '/dashboard/admin/blog', icon: 'article' },
      { label: 'Subscribers', href: '/dashboard/admin/subscribers', icon: 'group_add', count: 'subscribers' },
      { label: 'Edit pages', href: '/dashboard/admin/content', icon: 'edit_document' },
      { label: 'Advertisements', href: '/dashboard/admin/ads', icon: 'campaign' },
    ],
  },
  {
    label: 'Platform',
    links: [{ label: 'Account & team', href: '/dashboard/admin/settings', icon: 'tune' }],
  },
];

/** 1240 → "1.2k". Badges must stay narrow or the label truncates. */
function compact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

/**
 * Routes whose content needs the width more than the nav needs its labels.
 *
 * The guided listing screen is a two-column wizard with a live preview beside
 * it; at 1440px the 236px of nav labels is the difference between the preview
 * reading comfortably and wrapping every line.
 */
const WIDE_ROUTES = ['/dashboard/agent/new'];

const COLLAPSE_KEY = 'him_sidebar_collapsed';

export default function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState<NavCounts>({});

  /*
   * Two separate answers, because they are answers to different questions.
   *
   * `pref` is the standing preference for ordinary pages, remembered across
   * visits. `visitPref` is a choice made about the page currently open, and it
   * is thrown away on navigation.
   *
   * They were one value before, and the standing preference won everywhere.
   * That meant collapsing the nav once — or expanding it once — permanently
   * disabled the wizard's own default, so "New listing" stopped narrowing the
   * nav and nobody could see why. A preference about the pages you read is not
   * a preference about the page you work in.
   */
  const [pref, setPref] = useState<boolean | null>(null);
  const [visitPref, setVisitPref] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_KEY);
      if (stored === '0' || stored === '1') setPref(stored === '1');
    } catch {
      /* private mode or blocked storage — the route default still applies */
    }
  }, []);

  const routeWantsCollapse = WIDE_ROUTES.some((r) => pathname.startsWith(r));

  /* Moving to another page ends whatever was decided about the last one.
     Adjusted during render rather than in an effect, so the nav never paints
     one frame at the previous page's width. */
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setVisitPref(null);
  }

  /*
   * The wizard collapses on arrival every time, and can still be expanded for
   * as long as you are on it. Everywhere else follows the remembered
   * preference, defaulting to labels shown.
   */
  const collapsed = visitPref ?? (routeWantsCollapse ? true : pref ?? false);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setVisitPref(next);

    /* On a wide route the toggle is about this screen only. Writing it to
       storage would mean expanding the nav for one wizard session expanded it
       on every page from then on. */
    if (routeWantsCollapse) return;

    setPref(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
    } catch {
      /* the toggle still works for this session */
    }
  };

  const groups = role === 'admin' ? ADMIN_GROUPS : AGENT_GROUPS;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dashboard/nav-counts', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((d) => { if (!cancelled) setCounts(d.counts ?? {}); })
      .catch(() => { /* badges are an enhancement; the nav works without them */ });
    return () => { cancelled = true; };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push('/auth');
    }
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <Link
        href="/"
        className="brand"
        style={{ textDecoration: 'none' }}
        title={collapsed ? 'House in Mozambique' : undefined}
      >
        <span className="brand-mark" aria-hidden="true">H</span>
        <span className="brand-text">
          <span className="brand-name" style={{ display: 'block' }}>House in Mozambique</span>
          <span className="brand-sub" style={{ display: 'block' }}>
            {role === 'admin' ? 'Ops console' : 'Agent workspace'}
          </span>
        </span>
      </Link>

      <nav className="custom-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {groups.map((group, gi) => (
          <div key={group.label ?? `g${gi}`}>
            {group.label && <p className="nav-label" style={{ margin: 0 }}>{group.label}</p>}
            {group.links.map((link) => {
              const isActive = pathname === link.href;
              const value = link.count ? counts[link.count] : undefined;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`nav-item${isActive ? ' active' : ''}`}
                  style={{ textDecoration: 'none' }}
                  // The label is the only thing naming this row; with it hidden
                  // the icon needs to answer "what is this" on hover.
                  title={collapsed ? link.label : undefined}
                >
                  <Icon name={link.icon} size={17} />
                  <span className="nav-text">{link.label}</span>
                  {/* A zero means nothing is waiting, so the badge disappears. */}
                  {typeof value === 'number' && value > 0 && (
                    <span className="nav-count">{compact(value)}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="nav-item"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size={17} />
          <span className="nav-text">Collapse</span>
        </button>
        <Link href="/" className="nav-item" title={collapsed ? 'View storefront' : undefined}>
          <Icon name="home_work" size={17} />
          <span className="nav-text">View storefront</span>
          <Icon name="arrow_forward" size={13} className="ext" />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="nav-item signout"
          title={collapsed ? 'Sign out' : undefined}
        >
          <Icon name="logout" size={17} />
          <span className="nav-text">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
