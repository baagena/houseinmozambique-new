/**
 * Explicit field allow-lists for data that crosses into client components.
 *
 * A TypeScript interface on a client component's props does NOT strip fields at
 * runtime — it only describes them. A bare `prisma.agent.findMany()` returns the
 * whole row, and every field gets serialised into the RSC payload that ships to
 * the browser, interface or no interface. That is how `password`,
 * `emailVerifyToken` and `passwordResetToken` were reaching page source.
 *
 * Use these with `select:` on any query whose result flows toward a
 * `'use client'` component. Never widen one to include a credential column.
 */

/** Safe for any surface, including public pages. No email, no tokens, no hash. */
export const AGENT_PUBLIC = {
  id: true,
  name: true,
  initials: true,
  title: true,
  location: true,
  phone: true,
  avatar: true,
  bio: true,
  yearsExperience: true,
  specializations: true,
  rating: true,
  reviewCount: true,
  isVerified: true,
  isFeatured: true,
  role: true,
  createdAt: true,
} as const;

/**
 * For admin tables that legitimately need to show the account's email address.
 * Still excludes `password`, `emailVerifyToken` and `passwordResetToken`.
 */
export const AGENT_ADMIN_LIST = {
  ...AGENT_PUBLIC,
  email: true,
  emailVerifiedAt: true,
} as const;
