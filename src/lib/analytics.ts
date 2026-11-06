/**
 * GA4 tracking of people getting in touch.
 *
 * Every contact is one GA4 event named `contact`, with a `channel` saying how.
 * ContactEvent records which listing was contacted; this records which traffic
 * source brought them, which is the part only GA4 can see. Mark `contact` as a
 * key event in GA4 (Admin > Events) for it to count as a conversion.
 *
 * These are presses and submissions, not confirmed conversations: pressing the
 * WhatsApp button doesn't prove a message was sent.
 */
export type ContactChannel = 'whatsapp' | 'call' | 'email' | 'form' | 'viewing' | 'request';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Staff and account pages. Tracking them would count the team as visitors. */
export function isStaffPath(pathname: string): boolean {
  return /^(\/en)?\/(dashboard|auth)(\/|$)/.test(pathname);
}

export function channelFromHref(href: string): ContactChannel | null {
  if (href.startsWith('tel:')) return 'call';
  if (href.startsWith('mailto:')) return 'email';
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) return 'whatsapp';
  return null;
}

export function trackContact(channel: ContactChannel): void {
  window.gtag?.('event', 'contact', { channel });
}
