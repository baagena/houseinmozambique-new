import { prisma } from './db';
import { defaultPricingPlanRecords, toPricingPlanRecord, type PricingPlanRecord } from './pricing';

/**
 * Active plans for the public pricing page. Falls back to the shipped defaults
 * so the page never renders empty if the table has not been seeded yet.
 *
 * Kept apart from `pricing.ts` because that module is imported by client
 * components, which must not pull the database driver into the browser bundle.
 */
export async function getPublicPricingPlans(): Promise<PricingPlanRecord[]> {
  try {
    const rows = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    if (rows.length === 0) return defaultPricingPlanRecords();
    return rows.map(toPricingPlanRecord);
  } catch (error) {
    console.error('getPublicPricingPlans: falling back to defaults', error);
    return defaultPricingPlanRecords();
  }
}
