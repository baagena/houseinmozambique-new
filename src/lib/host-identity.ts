/**
 * Who a listing is presented as having been posted by.
 *
 * Every listing on the site today belongs to the staff account whose name in
 * the database is "System Administrator", so that is the byline a visitor read
 * under "Who's selling" — an internal role name, on the most trust-sensitive
 * line of a property page. Nobody rings System Administrator.
 *
 * When staff post a property, the seller is the platform. So an ADMIN-owned
 * listing is bylined "House in Mozambique" and carries the house avatar.
 *
 * This is a DISPLAY rule, not a rename. The stored account keeps its real name
 * because the admin console, the audit trail and the notification emails all
 * need to say which human account acted — "House in Mozambique approved this"
 * would be worse than useless in a log. The swap happens at the last possible
 * moment, on the way to the screen.
 *
 * No imports, so a server component and a client component can share it.
 */

export const HOUSE_NAME = 'House in Mozambique';
export const HOUSE_INITIALS = 'HM';

export interface HostLike {
  id?: string | null;
  name?: string | null;
  initials?: string | null;
  title?: string | null;
  role?: string | null;
  isVerified?: boolean | null;
}

export interface HostIdentity {
  /** The byline. Never an internal role name. */
  name: string;
  /** Two letters for the avatar chip. */
  initials: string;
  /** True when the platform itself is the seller. */
  isHouse: boolean;
  /**
   * The public directory anchor, or null when there is no profile to open.
   *
   * The house account is deliberately absent from /agents, so linking to it
   * would drop the visitor at the top of a directory with nothing highlighted
   * — a link that silently does the wrong thing is worse than no link.
   */
  profileHref: string | null;
  /** The house is the platform; it is verified by definition. */
  isVerified: boolean;
}

/** Two initials from a name, for accounts that never had any recorded. */
function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .join('');
  return (letters || name.slice(0, 2)).toUpperCase().slice(0, 2);
}

export function hostIdentity(host: HostLike | null | undefined): HostIdentity | null {
  if (!host) return null;

  const isHouse = (host.role ?? '').toUpperCase() === 'ADMIN';
  if (isHouse) {
    return {
      name: HOUSE_NAME,
      initials: HOUSE_INITIALS,
      isHouse: true,
      profileHref: null,
      isVerified: true,
    };
  }

  const name = (host.name ?? '').trim();
  if (!name) return null;

  return {
    name,
    initials: (host.initials ?? '').trim().toUpperCase().slice(0, 2) || initialsOf(name),
    isHouse: false,
    profileHref: host.id ? `/agents#${host.id}` : null,
    isVerified: Boolean(host.isVerified),
  };
}
