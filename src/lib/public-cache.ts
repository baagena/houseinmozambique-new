import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Keeping the cached public pages in step with the database.
 *
 * Public pages are rendered once and then served from the cache, rather than
 * for every visit (src/app/[lang]/layout.tsx). After a write to anything they
 * show, src/lib/db.ts calls purgeAfterWrite(), which marks every public page
 * stale; each one is rebuilt on its next visit, with the new data.
 *
 * One purge for the whole site, not a list of paths per write. A listing
 * appears on the home page, the search page, its own page, its agent's page
 * and in "similar listings" on others, and a path list per write is exactly
 * what goes out of date. Writes to these tables are rare (agents and staff
 * editing), and a purge costs one render per page visited afterwards.
 */

/**
 * Queries cached on their own, outside a cached page: the search page's
 * listings, the sitemap, the header's ads and the app's home screen.
 */
export const PUBLIC_DATA_TAG = 'public-data';

/**
 * The tables public pages read, each with the columns that change without
 * changing any page: visitor counters and private account fields. A write
 * that touches only those does not purge. Without that, every contact click
 * would throw away the whole cache.
 */
const PUBLIC_TABLES: Record<string, ReadonlySet<string>> = {
  Property: new Set(['views', 'contactClicks', 'viewingClicks']),
  Advertisement: new Set(['clickCount']),
  Agent: new Set([
    'password',
    'emailVerifyToken',
    'emailVerifyExpiresAt',
    'passwordResetToken',
    'passwordResetExpiresAt',
    'termsAcceptedAt',
  ]),
  BlogPost: new Set(),
  SiteContent: new Set(),
  AppSetting: new Set(),
  PricingPlan: new Set(),
  Subscription: new Set(),
  ListingAddon: new Set(),
  FeaturePick: new Set(),
};

const WRITES = new Set([
  'create',
  'createMany',
  'createManyAndReturn',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'upsert',
  'delete',
  'deleteMany',
]);

/** True when a write changes something a public page shows. */
export function changesPublicPages(model: string | undefined, operation: string, args: { data?: unknown }): boolean {
  if (!model || !WRITES.has(operation)) return false;
  const ignored = PUBLIC_TABLES[model];
  if (!ignored) return false;

  if ((operation === 'update' || operation === 'updateMany') && args?.data && typeof args.data === 'object') {
    const fields = Object.keys(args.data as object);
    if (fields.length > 0 && fields.every((f) => ignored.has(f))) return false;
  }
  return true;
}

/** Mark every cached public page and cached public query stale. */
export function purgePublicPages() {
  try {
    revalidatePath('/[lang]', 'layout');
    // Gone now, not served stale once more: an edit should show on the next visit.
    revalidateTag(PUBLIC_DATA_TAG, { expire: 0 });
  } catch {
    /*
     * Not in a route handler or server action: a write made while a page
     * renders (the home page records its featured pick), or a script outside
     * Next. Next refuses a purge there, by throwing before it changes
     * anything. The page being rendered already has the new data, and the
     * hourly backstop catches anything else.
     */
  }
}

export function purgeAfterWrite(model: string | undefined, operation: string, args: { data?: unknown }) {
  if (changesPublicPages(model, operation, args)) purgePublicPages();
}
