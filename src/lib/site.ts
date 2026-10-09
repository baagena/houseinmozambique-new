/**
 * The site's canonical origin — the ONE place it is defined.
 *
 * metadataBase, canonical tags, Open Graph / Twitter URLs, JSON-LD, the
 * sitemap, robots.txt and links in emails all build on this. Set
 * NEXT_PUBLIC_BASE_URL per environment. Production serves the bare domain,
 * https://houseinmozambique.com, and www 308-redirects to it, so the variable
 * there must be the bare domain: a www value would make every canonical and
 * sitemap URL a redirect. `||` rather than `??` so an
 * empty variable falls back instead of producing relative URLs.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://houseinmozambique.com').replace(/\/+$/, '');

/** The host alone ("www.houseinmozambique.com"), for places that print it. */
export const SITE_HOST = new URL(SITE_URL).host;
