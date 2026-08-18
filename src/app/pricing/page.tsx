import { getPublicPricingPlans } from '@/lib/pricing-server';
import PricingClient from '@/components/pricing/PricingClient';

// Plans are edited live from the admin console, so never serve a stale build.
export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const plans = await getPublicPricingPlans();

  return <PricingClient plans={plans} />;
}
