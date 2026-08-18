import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toPricingPlanRecord } from '@/lib/pricing';
import { planDataFromBody, requirePricingAdmin, revalidatePricing } from '@/lib/pricing-admin';

export async function GET() {
  const admin = await requirePricingAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const plans = await prisma.pricingPlan.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json(plans.map(toPricingPlanRecord));
}

export async function POST(req: NextRequest) {
  const admin = await requirePricingAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = planDataFromBody(await req.json());

  if (!data.slug || !data.nameEn || !data.priceEn) {
    return NextResponse.json(
      { error: 'A plan key, an English name and a price are required.' },
      { status: 400 }
    );
  }

  const existing = await prisma.pricingPlan.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json(
      { error: `A plan with the key "${data.slug}" already exists.` },
      { status: 409 }
    );
  }

  const plan = await prisma.pricingPlan.create({ data });
  revalidatePricing();
  return NextResponse.json(toPricingPlanRecord(plan));
}
