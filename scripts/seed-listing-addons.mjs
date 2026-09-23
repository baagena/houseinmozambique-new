/**
 * Creates the two add-on products so they can be priced and sold.
 *
 * Add-ons are PricingPlan rows with `kind: "addon"`, which means the admin
 * names and prices them on the pricing screen they already use, checkout
 * charges `priceMinor` server-side, and the manual payment flow — reference,
 * proof, verification — works on them unchanged.
 *
 * THEY ARE CREATED INACTIVE AND PRICED AT ZERO, on purpose. Nothing in this
 * repository invents a price: an add-on with no price is not offered, so
 * running this script changes nothing an agent can see until somebody opens
 * /dashboard/admin/pricing, sets a figure and switches it on.
 *
 * Idempotent — running it twice does not overwrite a price you have set.
 *
 *   node scripts/seed-listing-addons.mjs
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const ADDONS = [
  {
    slug: 'addon-featured',
    nameEn: 'Featured placement',
    namePt: 'Destaque',
    descriptionEn: 'Appears in the featured rail on the homepage and at the top of its city page.',
    descriptionPt: 'Aparece na faixa de destaques da página inicial e no topo da página da cidade.',
    sortOrder: 200,
  },
  {
    slug: 'addon-urgent',
    nameEn: 'Urgent — top of results',
    namePt: 'Urgente — topo dos resultados',
    descriptionEn: 'Sorted above other listings in every search it matches.',
    descriptionPt: 'Ordenado acima dos outros anúncios em todas as pesquisas em que aparece.',
    sortOrder: 201,
  },
];

async function main() {
  console.log(`Database: ${new URL(url).host}\n`);

  for (const a of ADDONS) {
    const existing = await prisma.pricingPlan.findUnique({ where: { slug: a.slug } });

    if (existing) {
      console.log(
        `  ${a.slug.padEnd(16)} already exists — ${existing.priceMinor > 0 ? `${existing.priceMinor / 100} ${existing.currency}` : 'no price set'}`
        + `, ${existing.isActive ? 'on sale' : 'not on sale'}. Left alone.`,
      );
      continue;
    }

    await prisma.pricingPlan.create({
      data: {
        slug: a.slug,
        kind: 'addon',
        nameEn: a.nameEn,
        namePt: a.namePt,
        descriptionEn: a.descriptionEn,
        descriptionPt: a.descriptionPt,
        // Zero and inactive: not offered until somebody decides the price.
        priceMinor: 0,
        isActive: false,
        currency: 'MZN',
        interval: null,
        durationDays: 30,
        listingQuota: 0,
        featuredQuota: 0,
        sortOrder: a.sortOrder,
        priceEn: '—',
        pricePt: '—',
        unitEn: '/30 days',
        unitPt: '/30 dias',
        ctaEn: 'Boost',
        ctaPt: 'Destacar',
        featuresEn: [],
        featuresPt: [],
      },
    });
    console.log(`  ${a.slug.padEnd(16)} created — no price, not on sale.`);
  }

  console.log(
    '\nNext: open /dashboard/admin/pricing, set a price for each and switch them on.'
    + '\nUntil then agents see "No boosts are on sale yet", which is the truth.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
