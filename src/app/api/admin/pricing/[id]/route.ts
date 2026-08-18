import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toPricingPlanRecord } from '@/lib/pricing';
import { planDataFromBody, requirePricingAdmin, revalidatePricing } from '@/lib/pricing-admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePricingAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = planDataFromBody(await req.json());

  if (!data.slug || !data.nameEn || !data.priceEn) {
    return NextResponse.json(
      { error: 'A plan key, an English name and a price are required.' },
      { status: 400 }
    );
  }

  const clash = await prisma.pricingPlan.findUnique({ where: { slug: data.slug } });
  if (clash && clash.id !== id) {
    return NextResponse.json(
      { error: `Another plan already uses the key "${data.slug}".` },
      { status: 409 }
    );
  }

  const plan = await prisma.pricingPlan.update({ where: { id }, data });
  revalidatePricing();
  return NextResponse.json(toPricingPlanRecord(plan));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePricingAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.pricingPlan.delete({ where: { id } });
  revalidatePricing();
  return NextResponse.json({ success: true });
}
