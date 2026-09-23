/**
 * The shape the payments ledger passes across the server/client boundary.
 *
 * Its own module because a value exported from a `'use client'` file does not
 * survive being imported by a server component: React hands back a client
 * reference, so `PAGE_SIZE` arrived at Prisma as a function and the query
 * failed with "could not serialize [object Function]". Types would have been
 * fine — they are erased — but the page and the table have to agree on the
 * page size at runtime, so the constant lives here where both can read it.
 */

/** Rows per page. The server's take/skip and the table's "showing x–y" agree on this. */
export const PAGE_SIZE = 20;

/**
 * Which rows a filter pill selects.
 *
 * 'free' is the odd one out: it lists AGENTS rather than payments, because the
 * people it is about have no payment row at all. They were invisible on a page
 * built only from the ledger, which is precisely the problem — an agent using
 * the platform for nothing is the one you most want to be able to find.
 */
export type PaymentFilter = 'all' | 'pending' | 'active' | 'expired' | 'free';

export interface AdminPayment {
  id: string;
  orderRef: string;
  amountMinor: number;
  currency: string;
  method: string;
  planSlug: string;
  planName: string;
  planKind: string;
  planInterval: string | null;
  /**
   * The swatch colour for this plan, in degrees.
   *
   * Assigned by the plan's position in the full plan list rather than hashed
   * from its slug: any hash collides, and two plans sharing a colour defeats
   * the only thing the swatch is for. Spacing by position makes the colours
   * evenly separated and stable for as long as the plan list is.
   */
  planHue: number;
  status: string;
  agentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  /** The payer's own confirmation code when there is one, else the gateway id. */
  payerReference: string | null;
  hasProof: boolean;
  reviewedBy: string | null;
  /** Whether this payment produced a Subscription or ListingCredit. */
  granted: boolean;
  /** Whether what it bought is still in force right now. */
  live: boolean;
  paidAt: string;
  settled: boolean;
  expiresAt: string | null;
  createdAt: string;
}

/**
 * Somebody using the platform without paying for it.
 *
 * Two kinds, kept apart because the follow-up differs: the automatic free tier
 * (`ensureFreePlan` gives every new account a zero-price plan) and an account
 * an admin comped by hand. The second has a name attached to it and usually a
 * reason, and it is the one worth reviewing.
 */
export interface FreeAgentRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  /** null when the account has not been given any plan yet. */
  planName: string | null;
  planHue: number;
  listingQuota: number;
  listingsUsed: number;
  /** Granted by an admin rather than by the automatic free tier. */
  comped: boolean;
  grantedBy: string | null;
  grantNote: string | null;
  /** null for the free tier, which is written with a 50-year end date. */
  endsAt: string | null;
  joinedAt: string;
}

export interface PaymentStats {
  payments: number;
  active: number;
  expired: number;
  revenueMinor: number;
  /** Waiting on the payer or on us. */
  pending: number;
  /** Proof submitted, waiting on us specifically. */
  awaitingReview: number;
  /** Accounts on the free tier or comped by an admin. */
  free: number;
}
