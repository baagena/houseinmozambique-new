/**
 * getProperties()/getPropertyById() in src/lib/data.ts use `include: { host: true }`,
 * which is safe in server components (never serialized raw to the browser) but would
 * leak the agent's password hash + email if returned directly as JSON from a mobile
 * API route. Strip those fields before sending a property (or list of properties) out.
 */
export function sanitizeHost<T extends { password?: string; email?: string }>(host: T) {
  const { password, email, ...safeHost } = host;
  return safeHost;
}

export function sanitizeProperty<T extends { host: any }>(property: T) {
  return { ...property, host: sanitizeHost(property.host) };
}

export function sanitizeProperties<T extends { host: any }>(properties: T[]) {
  return properties.map(sanitizeProperty);
}
