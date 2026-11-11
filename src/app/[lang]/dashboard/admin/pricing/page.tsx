import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { DEFAULT_PRICING_PLANS, toPricingPlanRecord } from '@/lib/pricing';
import AdminPricingClient from '@/components/dashboard/AdminPricingClient';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminPricingPage() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

  const admin = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { role: true },
  });
  if (!admin || admin.role !== 'ADMIN') redirect('/dashboard/agent');

  // First visit: lift the plans that used to be hard-coded on /pricing into the
  // database so the admin has something to edit instead of an empty screen.
  const count = await prisma.pricingPlan.count();
  if (count === 0) {
    await prisma.pricingPlan.createMany({ data: DEFAULT_PRICING_PLANS as unknown as Prisma.PricingPlanCreateManyInput[] });
  }

  const plans = await prisma.pricingPlan.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return <AdminPricingClient plans={plans.map(toPricingPlanRecord)} />;
}
