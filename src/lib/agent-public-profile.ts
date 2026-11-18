import { readSocialLinks } from '@/lib/agent-contact-links';

/**
 * A profile row (AGENT_PROFILE_SELECT) as the app receives it: social links
 * cleaned, and whether this is a corporate agency spelled out, so the app
 * and the website decide "corporate" the same way (an agency name is set).
 */
export function toPublicProfile<T extends { socialLinks?: unknown; agencyName?: string | null }>(row: T) {
  return {
    ...row,
    socialLinks: readSocialLinks(row.socialLinks),
    isCorporate: Boolean(row.agencyName),
  };
}
