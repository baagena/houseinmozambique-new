'use client';

import { usePathname } from 'next/navigation';
import SiteHeader from './SiteHeader';
import Footer from './Footer';

/**
 * Wraps the public marketplace in the redesign shell (two-tier header, navy
 * footer) and marks it with `.site` so the editorial type scale applies.
 * Dashboard/auth/post-property keep their own focused chrome.
 */
const BARE_PATHS = ['/dashboard', '/auth', '/post-property'];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const bare = BARE_PATHS.some((p) => pathname.startsWith(p));

  if (bare) {
    // Auth and post-property still get the redesign palette; the dashboard does not.
    const themed = !pathname.startsWith('/dashboard');
    return <main className={themed ? 'site no-tabs min-h-screen' : 'min-h-screen'}>{children}</main>;
  }

  return (
    <div className="site">
      <SiteHeader />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </div>
  );
}
