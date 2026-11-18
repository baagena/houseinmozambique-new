/**
 * An agent's public contact channels: WhatsApp, social profiles, website.
 *
 * Shared by the profile editors (web + app), the public profile pages and the
 * contact-tracking endpoint, so a link is validated once and every surface
 * agrees on which networks exist.
 */

export const SOCIAL_NETWORKS = ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'x'] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];
export type SocialLinks = Partial<Record<SocialNetwork, string>>;

/** The hosts each network's links may point at (subdomains allowed). */
const HOSTS: Record<SocialNetwork, string[]> = {
  facebook: ['facebook.com', 'fb.com', 'fb.me'],
  instagram: ['instagram.com'],
  linkedin: ['linkedin.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'],
  x: ['x.com', 'twitter.com'],
};

/** Where a bare handle ("@houseinmoz") is expanded to. */
const HANDLE_BASE: Partial<Record<SocialNetwork, string>> = {
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/@',
  youtube: 'https://www.youtube.com/@',
  x: 'https://x.com/',
};

/** Every channel a contact press can be recorded under (ContactEvent.channel). */
export const CONTACT_CHANNELS = {
  whatsapp: 'WHATSAPP',
  call: 'CALL',
  email: 'EMAIL',
  form: 'FORM',
  website: 'WEBSITE',
  facebook: 'FACEBOOK',
  instagram: 'INSTAGRAM',
  linkedin: 'LINKEDIN',
  tiktok: 'TIKTOK',
  youtube: 'YOUTUBE',
  x: 'X',
} as const;
export type ContactChannelKey = keyof typeof CONTACT_CHANNELS;

function hostAllowed(host: string, allowed: string[]): boolean {
  const h = host.toLowerCase().replace(/^www\./, '');
  return allowed.some((a) => h === a || h.endsWith(`.${a}`));
}

/**
 * One link as typed by the agent → a clean https URL, or an error message.
 * Accepts full URLs, URLs without the scheme, and (for most networks) a bare
 * @handle. Empty input clears the link.
 */
export function normalizeSocialLink(network: SocialNetwork, raw: unknown): { url: string | null } | { error: string } {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return { url: null };
  if (value.length > 300) return { error: `The ${network} link is too long.` };

  const handle = /^@?([A-Za-z0-9._-]{2,60})$/.exec(value);
  if (handle && HANDLE_BASE[network]) return { url: `${HANDLE_BASE[network]}${handle[1]}` };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return { error: `Enter a valid ${network} link.` };
  }
  if (!hostAllowed(url.hostname, HOSTS[network])) {
    return { error: `The ${network} link must point to ${HOSTS[network][0]}.` };
  }
  url.protocol = 'https:';
  return { url: url.toString() };
}

/** The whole set from a request body; unknown keys are ignored. */
export function normalizeSocialLinks(raw: unknown): { links: SocialLinks } | { error: string } {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const links: SocialLinks = {};
  for (const network of SOCIAL_NETWORKS) {
    if (!(network in input)) continue;
    const result = normalizeSocialLink(network, input[network]);
    if ('error' in result) return result;
    if (result.url) links[network] = result.url;
  }
  return { links };
}

/** Reads the stored JSON defensively: only known networks with https URLs. */
export function readSocialLinks(value: unknown): SocialLinks {
  const out: SocialLinks = {};
  if (!value || typeof value !== 'object') return out;
  for (const network of SOCIAL_NETWORKS) {
    const url = (value as Record<string, unknown>)[network];
    if (typeof url === 'string' && /^https:\/\//i.test(url)) out[network] = url;
  }
  return out;
}

/** A phone number as wa.me wants it: digits only, with Mozambique's 258. */
export function whatsappDigits(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 9 && digits.startsWith('8')) digits = `258${digits}`;
  if (digits.startsWith('0') && digits.length === 10) digits = `258${digits.slice(1)}`;
  return digits.length >= 9 ? digits : null;
}

/** Profile-level contact fields from a PATCH body (web + app editors). */
export function parseContactFields(body: Record<string, unknown>):
  | { data: { whatsapp?: string | null; socialLinks?: SocialLinks } }
  | { error: string } {
  const data: { whatsapp?: string | null; socialLinks?: SocialLinks } = {};
  if (body.whatsapp !== undefined) {
    const value = String(body.whatsapp ?? '').trim();
    if (value && !whatsappDigits(value)) return { error: 'Enter a valid WhatsApp number.' };
    data.whatsapp = value || null;
  }
  if (body.socialLinks !== undefined) {
    const result = normalizeSocialLinks(body.socialLinks);
    if ('error' in result) return result;
    data.socialLinks = result.links;
  }
  return { data };
}
