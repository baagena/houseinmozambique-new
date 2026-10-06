'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Sends one beacon per public page view (including client-side navigation),
 * for the visitor numbers on the admin dashboard. The server decides what
 * counts — see app/api/visit/route.ts.
 */
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/visit', { method: 'POST', keepalive: true }).catch(() => {});
  }, [pathname]);

  return null;
}
