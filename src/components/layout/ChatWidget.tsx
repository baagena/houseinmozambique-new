'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

/**
 * Tidio live chat. It only belongs on the public marketplace — on the
 * dashboard and the auth/post flows it covers real controls and adds nothing.
 *
 * Tidio renders its launcher in a fixed-position iframe it styles itself, so
 * the only way to move it is to override that iframe from here. On mobile it
 * has to clear the sticky price bar on a property page.
 */
const HIDDEN_PATHS = ['/dashboard', '/auth', '/post-property'];

export default function ChatWidget() {
  const pathname = usePathname() || '/';
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      <style>{`
        /* Desktop: sit just inside the corner rather than flush to it. */
        #tidio-chat-iframe {
          bottom: 20px !important;
          right: 16px !important;
          z-index: 70 !important;
        }
        @media (max-width: 680px) {
          #tidio-chat-iframe {
            bottom: calc(14px + env(safe-area-inset-bottom)) !important;
            right: 10px !important;
            z-index: 74 !important;
          }
          /* A property page has a sticky price bar pinned to the bottom edge. */
          body:has(.pdp-page) #tidio-chat-iframe {
            bottom: calc(84px + env(safe-area-inset-bottom)) !important;
          }
        }
      `}</style>
      <Script
        src="//code.tidio.co/dskhwbtaf4xshe1pluqs7ilizketnylv.js"
        strategy="lazyOnload"
      />
    </>
  );
}
