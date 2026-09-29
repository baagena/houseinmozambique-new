import { prisma } from '@/lib/db';
import { consumeCredit, grantManually } from '@/lib/entitlements';
import { featureFromPlan } from '@/lib/listing-addons';

/**
 * Plans chosen in the listing wizard, activated when the team approves.
 *
 * While online payment is not set up, a paid plan is sold like this: the agent
 * builds a listing and picks a plan; the listing waits in the approval queue
 * with `requestedPlanSlug`; the team confirms the payment and approves, and
 * approval activates the plan for that listing — a single-listing plan
 * (Destaque, Super Destaque) becomes a consumed credit with its publication
 * period, a monthly plan starts or extends the subscription — and, where the
 * plan includes featuring, the listing goes on the homepage.
 */

/** A plan an agent may pick in the wizard: active, and not the free tier. */
export async function findRequestablePlan(slug: unknown) {
  if (typeof slug !== 'string' || !slug) return null;
  const plan = await prisma.pricingPlan.findUnique({ where: { slug } });
  if (!plan || !plan.isActive || plan.kind === 'addon') return null;
  if (plan.priceMinor === 0 && plan.ctaMode !== 'contact') return null;
  return plan;
}

/**
 * Activates the plan a listing asked for. Idempotent: a listing that already
 * has a credit or subscription attached is left as it is. Returns the plan's
 * name when something was activated.
 */
export async function activateRequestedPlan(propertyId: string, grantedBy: string): Promise<string | null> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { hostId: true, title: true, requestedPlanSlug: true, listingCreditId: true, subscriptionId: true },
  });
  if (!property?.requestedPlanSlug) return null;
  if (property.listingCreditId || property.subscriptionId) return null;

  const plan = await prisma.pricingPlan.findUnique({ where: { slug: property.requestedPlanSlug } });
  if (!plan) return null;

  const note = `Requested with the listing "${property.title}"`;
  const granted = await grantManually({ agentId: property.hostId, planSlug: plan.slug, grantedBy, note });

  if (plan.kind === 'one_off') {
    const creditId = granted.id;
    const publishedUntil = new Date(Date.now() + (plan.durationDays ?? 30) * 86_400_000);
    await consumeCredit(creditId, propertyId);
    await prisma.property.update({ where: { id: propertyId }, data: { listingCreditId: creditId, publishedUntil } });
    await featureFromPlan({ propertyId, agentId: property.hostId, listingCreditId: creditId, publishedUntil });
  } else {
    await prisma.property.update({ where: { id: propertyId }, data: { subscriptionId: granted.id } });
    await featureFromPlan({ propertyId, agentId: property.hostId, subscriptionId: granted.id });
  }

  return plan.namePt || plan.nameEn;
}
