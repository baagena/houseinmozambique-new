import { hostIdentity } from '@/lib/host-identity';
/**
 * getProperties()/getPropertyById() in src/lib/data.ts use `include: { host: true }`,
 * which is safe in server components (never serialized raw to the browser) but would
 * leak the agent's password hash + email if returned directly as JSON from a mobile
 * API route. Strip those fields before sending a property (or list of properties) out.
 */
export function sanitizeHost<
  T extends {
    password?: string;
    email?: string;
    emailVerifiedAt?: unknown;
    emailVerifyToken?: string | null;
    emailVerifyExpiresAt?: unknown;
    passwordResetToken?: string | null;
    passwordResetExpiresAt?: unknown;
  },
>(host: T) {
  const {
    password,
    email,
    emailVerifiedAt,
    emailVerifyToken,
    emailVerifyExpiresAt,
    passwordResetToken,
    passwordResetExpiresAt,
    ...safeHost
  } = host;
  return safeHost;
}

export function sanitizeProperty<T extends { host: any }>(property: T) {
  const host = sanitizeHost(property.host);

  /*
   * The byline, applied server-side so the app shows what the website shows.
   *
   * A staff-owned listing is the platform's own, and printing the staff
   * account's name ("System Administrator") under a property is an internal
   * role name on the line a buyer uses to decide whether to make contact.
   * Doing it here rather than in Dart keeps one rule for both surfaces.
   */
  const identity = host ? hostIdentity(host as never) : null;
  return {
    ...property,
    host: identity
      ? { ...host, name: identity.name, initials: identity.initials }
      : host,
  };
}

export function sanitizeProperties<T extends { host: any }>(properties: T[]) {
  return properties.map(sanitizeProperty);
}
