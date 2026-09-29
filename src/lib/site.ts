/**
 * The site's canonical origin — the ONE place it is defined.
 *
 * metadataBase, canonical tags, Open Graph / Twitter URLs, JSON-LD, the
 * sitemap, robots.txt and links in emails all build on this. Set
 * NEXT_PUBLIC_BASE_URL per environment; production is
 * https://www.houseinmozambique.com (with www). `||` rather than `??` so an
 * empty variable falls back instead of producing relative URLs.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.houseinmozambique.com').replace(/\/+$/, '');

/** The host alone ("www.houseinmozambique.com"), for places that print it. */
export const SITE_HOST = new URL(SITE_URL).host;
