/**
 * One-off backfill for the `Property.approvedAt` column.
 *
 * Listings that were already live before the column existed have no approval
 * stamp, so their owners would be bounced back into the moderation queue after
 * suspending and reactivating. Treat "currently published" as "already
 * approved" and stamp it with the row's last update time.
 *
 * Run once per environment after `prisma db push`:
 *   npx tsx prisma/backfill-approved-at.ts
 */
import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function main() {
  const pending = await prisma.property.findMany({
    where: { status: 'PUBLISHED', approvedAt: null },
    select: { id: true, updatedAt: true },
  });

  for (const property of pending) {
    await prisma.property.update({
      where: { id: property.id },
      data: { approvedAt: property.updatedAt },
    });
  }

  console.log(`Backfilled approvedAt on ${pending.length} published listing(s).`);
  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
