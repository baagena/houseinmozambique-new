'use client';

import { useEffect, useInsertionEffect } from 'react';
import { usePathname } from 'next/navigation';
import { GoogleAnalytics } from '@next/third-parties/google';
import { channelFromHref, isStaffPath, trackContact } from '@/lib/analytics';

/**
 * Loads GA4, keeps staff pages out of it, and counts contact-link presses.
 *
 * `ga-disable-<id>` is Google's documented off switch. It is set rather than
 * leaving GA4 unmounted because the tag can't be unloaded once running, and
 * someone can move from a public page into the dashboard without a full page
 * load. An insertion effect, because it has to be set before the tag's first
 * hit on this page, and before the router records the navigation.
 *
 * Link presses are caught here, in one listener, so a contact link added
 * anywhere on the site later is counted without having to remember to wire it.
 */
export default function SiteAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname() || '/';
  const staff = isStaffPath(pathname);

  useInsertionEffect(() => {
    (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = staff;
  }, [gaId, staff]);

  useEffect(() => {
    if (staff) return;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      const channel = link && channelFromHref(link.getAttribute('href') ?? '');
      if (channel) trackContact(channel);
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [staff]);

  return <GoogleAnalytics gaId={gaId} />;
}
