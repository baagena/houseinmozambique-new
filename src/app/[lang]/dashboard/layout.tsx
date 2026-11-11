import DashboardShell from '@/components/dashboard/DashboardShell';

/*
 * Every dashboard page is rendered per request, for the account viewing it.
 * Public pages are cached (src/app/[lang]/layout.tsx); this keeps that from
 * ever reaching staff and agent screens, including any that read nothing
 * request-specific on the server.
 */
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
