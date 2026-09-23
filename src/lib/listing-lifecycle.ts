/**
 * When a listing was published and when it stops being published.
 *
 * Copied, in substance, from how houseinrwanda.com presents listings: every
 * card there carries a publication date and an expiry date. Two different jobs
 * are being done by those two dates and both are worth having.
 *
 * The publication date is for the BUYER. A property portal's credibility rests
 * on whether what you are looking at is still for sale, and a date is the
 * cheapest possible proof. Ours showed nothing, so a listing from March looked
 * exactly like one from yesterday.
 *
 * The expiry is for the AGENT and the admin. It is the clock on the money, and
 * it is what makes a plan feel like something you are using rather than a
 * charge that appears each month.
 *
 * WHY THIS IS COMPUTED RATHER THAN STORED. A one-off listing has a fixed
 * window and `Property.publishedUntil` holds it. A plan listing's window is
 * the subscription's, which moves — an early renewal extends it, an admin
 * grant extends it, a lapse pulls it into grace. Copying that date onto every
 * property would mean every renewal had to rewrite every row the agent owns,
 * and any row it missed would claim an expiry the platform would not honour.
 */

/**
 * How long a lapsed plan keeps its listings up while the renewal is chased.
 *
 * DEFINED HERE, and imported BY entitlements rather than from it. This module
 * is used by client components — the listing card and the detail page — and
 * pulling it from entitlements dragged the whole server chain into the browser
 * bundle: entitlements imports prisma, prisma imports pg, and pg requires
 * `dns`, which does not exist in a browser. The build failed with "Can't
 * resolve 'dns'" on every property page.
 *
 * So this file has no imports at all, and must keep none.
 */
export const GRACE_DAYS = 7;

/** The subscription fields this module needs, and nothing more. */
export interface LifecycleSubscription {
  status: string;
  currentPeriodEnd: Date;
  graceUntil: Date | null;
}

export interface LifecycleProperty {
  createdAt: Date;
  approvedAt: Date | null;
  publishedUntil: Date | null;
  subscription?: LifecycleSubscription | null;
}

export interface ListingLifecycle {
  /** When this went live. Null while it is still waiting for approval. */
  publishedAt: Date | null;
  /** When it comes down, or null when nothing sets a limit. */
  expiresAt: Date | null;
  /** Whole days until expiry; negative once past. Null when there is no limit. */
  daysLeft: number | null;
  /** Past its date but inside the grace window — still live, still chaseable. */
  inGrace: boolean;
  expired: boolean;
}

export function listingLifecycle(p: LifecycleProperty, now: Date = new Date()): ListingLifecycle {
  /*
   * A one-off window wins over the subscription's.
   *
   * A credit buys a fixed run — 60 days, say — and that run is what was paid
   * for. An agent who also happens to hold a monthly plan does not get the
   * credit listing extended by it, and an agent whose plan lapses does not
   * lose a listing they bought outright.
   */
  const expiresAt =
    p.publishedUntil
    ?? (p.subscription ? (p.subscription.graceUntil ?? p.subscription.currentPeriodEnd) : null);

  const publishedAt = p.approvedAt;

  if (!expiresAt) {
    return { publishedAt, expiresAt: null, daysLeft: null, inGrace: false, expired: false };
  }

  const ms = expiresAt.getTime() - now.getTime();
  const daysLeft = Math.ceil(ms / 86_400_000);

  /*
   * Grace is a property of the SUBSCRIPTION, not of a bought window.
   *
   * A plan that lapses keeps its listings up for a few days while the renewal
   * is chased, because a late M-Pesa top-up is not a customer leaving. A
   * one-off window has already been paid in full and simply ends.
   */
  const graceEnd = p.publishedUntil
    ? expiresAt
    : new Date(expiresAt.getTime() + GRACE_DAYS * 86_400_000);

  return {
    publishedAt,
    expiresAt,
    daysLeft,
    inGrace: ms <= 0 && now.getTime() <= graceEnd.getTime(),
    expired: now.getTime() > graceEnd.getTime(),
  };
}

/** The Prisma `include` that gives listingLifecycle() everything it reads. */
export const LIFECYCLE_INCLUDE = {
  subscription: { select: { status: true, currentPeriodEnd: true, graceUntil: true } },
} as const;

/**
 * "Listed 12 Sept 2026" — the line a buyer reads.
 *
 * Deliberately the publication date and not "updated", because an edit does
 * not make a property newly available and dating it that way would be a small
 * lie told to look fresh.
 */
export function publishedLabel(
  publishedAt: Date | null,
  lang: string,
  fallback: Date,
): string {
  const d = publishedAt ?? fallback;
  return d.toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
