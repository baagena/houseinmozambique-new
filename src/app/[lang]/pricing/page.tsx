import { getPublicPricingPlans } from '@/lib/pricing-server';
import PricingClient from '@/components/pricing/PricingClient';

/* Plans are edited live from the admin console. The page is cached, and an
   edit to a plan purges it (lib/public-cache.ts), so it is never stale. */

export default async function PricingPage() {
  const plans = await getPublicPricingPlans();

  return <PricingClient plans={plans} />;
}
