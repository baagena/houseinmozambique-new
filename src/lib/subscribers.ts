import { prisma } from './db';
import { SITE_URL } from './seo';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The link every broadcast carries. The subscriber id is the token — unguessable
 * enough to keep one recipient from unsubscribing another.
 */
export function unsubscribeUrl(subscriberId: string) {
  return `${SITE_URL}/api/newsletter/unsubscribe?id=${encodeURIComponent(subscriberId)}`;
}

/**
 * Records a signup. Re-subscribing an address that previously opted out
 * reactivates it rather than failing on the unique constraint.
 */
export async function upsertSubscriber(email: string, source = 'footer') {
  const normalized = email.trim().toLowerCase();

  const existing = await prisma.subscriber.findUnique({ where: { email: normalized } });

  if (existing) {
    if (existing.isActive) {
      return { subscriber: existing, alreadySubscribed: true };
    }

    const reactivated = await prisma.subscriber.update({
      where: { email: normalized },
      data: { isActive: true, unsubscribedAt: null, source },
    });
    return { subscriber: reactivated, alreadySubscribed: false };
  }

  const created = await prisma.subscriber.create({
    data: { email: normalized, source },
  });
  return { subscriber: created, alreadySubscribed: false };
}
