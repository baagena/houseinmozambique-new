/**
 * Copies Payment.amount (Float, major units) into Payment.amountMinor (Int,
 * centavos) for rows recorded before the column existed.
 *
 * Run once per environment, after `prisma db push`. Idempotent: it only touches
 * rows where amountMinor is still 0 and amount is not, so a second run is a
 * no-op rather than a multiplication.
 *
 *   DATABASE_URL="…" node scripts/backfill-payment-minor.mjs
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is not set.'); process.exit(1); }

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  console.log(`Database: ${new URL(url).host}`);
  const rows = await prisma.payment.findMany({
    where: { amountMinor: 0, amount: { gt: 0 } },
    select: { id: true, amount: true, orderRef: true },
  });

  if (!rows.length) { console.log('Nothing to backfill.'); return; }

  for (const r of rows) {
    // Round rather than truncate: 3500.005 stored as a float must not become
    // 350000 when the intent was 350001.
    const minor = Math.round(r.amount * 100);
    await prisma.payment.update({ where: { id: r.id }, data: { amountMinor: minor } });
    console.log(`  ${r.orderRef}  ${r.amount} -> ${minor} centavos`);
  }
  console.log(`\nBackfilled ${rows.length} payment(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
