/**
 * Makes the pricing table match DEFAULT_PRICING_PLANS in src/lib/pricing.ts.
 *
 * The admin pricing screen only seeds the defaults into an EMPTY table, so a
 * change to the shipped plans never reached a database that already had rows.
 * This upserts every default by slug and hides (never deletes) any other plan
 * — a plan an agent has paid for, or a subscription points at, must keep its
 * row. Add-ons (kind "addon") are left alone; they are not posting plans.
 *
 * Reports first; writes only with --apply. Idempotent.
 *
 *   node scripts/apply-default-plans.ts            # report
 *   node scripts/apply-default-plans.ts --apply    # write
 *
 * The DATABASE_URL in .env is the production database (see the repo notes).
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// Node runs this file directly (type stripping), and Node needs the extension.
// @ts-expect-error TS5097 — the project does not enable allowImportingTsExtensions.
import { DEFAULT_PRICING_PLANS } from '../src/lib/pricing.ts';

const apply = process.argv.includes('--apply');
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  console.log(`Database: ${new URL(url!).host}${apply ? '' : '  (report only — pass --apply to write)'}\n`);
  const existing = await prisma.pricingPlan.findMany({ select: { slug: true, kind: true, isActive: true } });
  const wanted = new Set(DEFAULT_PRICING_PLANS.map((p) => p.slug));

  for (const plan of DEFAULT_PRICING_PLANS) {
    const found = existing.find((e) => e.slug === plan.slug);
    console.log(`${found ? 'update' : 'create'}  ${plan.slug.padEnd(15)} ${plan.namePt} — ${plan.pricePt} ${plan.unitPt}`.trimEnd());
    if (!apply) continue;
    const data = { ...plan, featuresEn: plan.featuresEn as object[], featuresPt: plan.featuresPt as object[] };
    await prisma.pricingPlan.upsert({ where: { slug: plan.slug }, update: data, create: data });
  }

  for (const e of existing) {
    if (wanted.has(e.slug) || e.kind === 'addon' || !e.isActive) continue;
    console.log(`hide    ${e.slug}`);
    if (apply) await prisma.pricingPlan.update({ where: { slug: e.slug }, data: { isActive: false } });
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
