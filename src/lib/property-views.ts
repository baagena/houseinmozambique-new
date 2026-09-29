import { prisma } from '@/lib/db';

/**
 * How property views are counted.
 *
 * The count used to be a `views: { increment: 1 }` inside the property page's
 * server render. That counted every fetch of the page: search crawlers, the
 * link-preview bots WhatsApp and Facebook send when a listing is shared, every
 * refresh, and the agent checking their own listing. It also went through
 * Prisma's `update`, which bumps `Property.updatedAt` — so the sitemap told
 * search engines that a listing changed every time somebody looked at it.
 *
 * Views are now recorded by a beacon the page sends after it has loaded in a
 * browser (link-preview bots do not run the page's JavaScript), through the
 * checks below, with a raw UPDATE that leaves `updatedAt` alone.
 */

/** How long one browser counts as one view of the same listing. */
export const VIEW_DEDUPE_SECONDS = 30 * 60;

export const viewCookieName = (propertyId: string) => `hv_${propertyId}`;

/*
 * Crawlers and link unfurlers identify themselves. Anything that renders
 * JavaScript and says so (Googlebot does) would otherwise reach the beacon.
 */
const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|facebookcatalog|whatsapp|telegram|twitter|linkedin|pinterest|embedly|quora link|vkshare|skypeuripreview|headless|lighthouse|pagespeed|curl|wget|python-requests|axios|node-fetch|go-http-client|java\//i;

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT_UA.test(userAgent);
}

/**
 * Adds one view to a published listing. Raw SQL on purpose: Prisma sets
 * `@updatedAt` itself on every `update`, and a view is not an edit.
 */
export async function recordPropertyView(propertyId: string): Promise<boolean> {
  const changed = await prisma.$executeRaw`
    UPDATE "Property" SET "views" = "views" + 1
    WHERE "id" = ${propertyId} AND "status" = 'PUBLISHED'`;
  return changed > 0;
}
