/**
 * Gives every existing listing the readable address it should have had.
 *
 * Until now a property page was served from `/properties/<cuid>` — a random
 * identifier that tells a search engine nothing and a reader less. The wizard
 * had been generating the right string all along and showing it to the agent
 * under "What search engines will see"; it was simply never stored.
 *
 * Old URLs keep working: the route resolves a cuid and answers with a
 * permanent redirect to the slug, so shared links and whatever ranking they
 * carry survive.
 *
 * Idempotent — only touches rows whose slug is still null.
 *
 *   node scripts/backfill-property-slugs.mjs            # report only
 *   node scripts/backfill-property-slugs.mjs --apply
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const apply = process.argv.includes('--apply');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

/* Mirrors src/lib/property-slug.ts. Kept in step by hand rather than imported,
   because this is a plain .mjs script and that module is TypeScript. */
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function buildSlug(p) {
  const intent =
    p.listingType === 'Buy' ? 'for sale'
    : p.listingType === 'Rent' ? 'for rent'
    : p.listingType === 'Short Stay' ? 'short stay'
    : p.listingType === 'Auction' ? 'auction'
    : '';

  const isLand = (p.type ?? '').toLowerCase() === 'land';
  const parts = isLand
    ? ['land', intent, p.neighborhood, p.city]
    : [p.bedrooms ? `${p.bedrooms} bedroom` : '', p.type, intent, p.neighborhood, p.city];

  const built = slugify(parts.filter(Boolean).join(' '));
  if (built) return built;
  return slugify((p.title ?? 'listing').split(/\s+/).slice(0, 8).join(' ')) || 'listing';
}

async function main() {
  console.log(`Database: ${new URL(url).host}`);
  console.log(apply ? 'Mode: APPLY\n' : 'Mode: report only (pass --apply to write)\n');

  const rows = await prisma.property.findMany({
    where: { slug: null },
    select: { id: true, title: true, type: true, listingType: true, bedrooms: true, neighborhood: true, city: true },
    orderBy: { createdAt: 'asc' },
  });

  if (rows.length === 0) {
    console.log('Every listing already has a slug. Nothing to do.');
    return;
  }

  // Slugs already in use, so the run does not collide with itself or with rows
  // created since the column landed.
  const taken = new Set(
    (await prisma.property.findMany({ where: { slug: { not: null } }, select: { slug: true } }))
      .map((r) => r.slug),
  );

  let written = 0;
  for (const r of rows) {
    const root = buildSlug(r).slice(0, 80).replace(/-+$/, '') || 'listing';
    let slug = root;
    for (let n = 2; taken.has(slug); n++) slug = `${root}-${n}`;
    taken.add(slug);

    console.log(`  ${slug}`);
    console.log(`      was /properties/${r.id}`);

    if (apply) {
      await prisma.property.update({ where: { id: r.id }, data: { slug } });
      written++;
    }
  }

  console.log(
    apply
      ? `\nWrote ${written} slug(s). Old /properties/<id> links now redirect to them.`
      : `\n${rows.length} listing(s) would be given a slug. Re-run with --apply.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
