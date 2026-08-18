/**
 * One-off migration: newsletter signups used to be stored as Inquiry rows with
 * the subject "Newsletter subscription", which mixed the mailing list into the
 * contact-message inbox. Move them into the Subscriber table and drop the
 * inbox rows so the two lists are properly separate.
 *
 * Run once per environment after `prisma db push`:
 *   npx tsx prisma/migrate-newsletter-subscribers.ts
 */
import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function main() {
  const legacy = await prisma.inquiry.findMany({
    where: { subject: 'Newsletter subscription' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, createdAt: true },
  });

  let moved = 0;
  let alreadyPresent = 0;

  for (const row of legacy) {
    const email = row.email.trim().toLowerCase();
    if (!email) continue;

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      alreadyPresent += 1;
      continue;
    }

    await prisma.subscriber.create({
      data: { email, source: 'footer', createdAt: row.createdAt },
    });
    moved += 1;
  }

  // The mailing list now lives in Subscriber, so these inbox rows are redundant.
  const removed = await prisma.inquiry.deleteMany({
    where: { subject: 'Newsletter subscription' },
  });

  console.log(
    `Moved ${moved} subscriber(s) (${alreadyPresent} already on the list), ` +
      `removed ${removed.count} newsletter row(s) from the message inbox.`
  );

  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
