/**
 * Closes payment references that nobody owes any more.
 *
 * Until /api/payments learned to reuse an open reference, every visit to the
 * billing page that chose a plan minted a new one. Agents accumulated a pile of
 * PENDING rows for a plan they had already paid for; the billing page kept
 * asking them to pay, and the pending badge counted work that did not exist.
 *
 * A reference is superseded when a LATER payment for the SAME plan by the SAME
 * agent has settled. Those rows are moved to CANCELLED with a note saying which
 * payment replaced them. Nothing is deleted: a reference that was shown to a
 * payer has to stay explicable if they ring up quoting it.
 *
 * Only PENDING rows are touched. SUBMITTED means proof was sent and somebody
 * has to look at it; REJECTED means the payer was told to try again.
 *
 *   node scripts/close-superseded-payments.mjs            # report only
 *   node scripts/close-superseded-payments.mjs --apply    # make the change
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

async function main() {
  console.log(`Database: ${new URL(url).host}`);
  console.log(apply ? 'Mode: APPLY\n' : 'Mode: report only (pass --apply to make the change)\n');

  const [open, settled] = await Promise.all([
    prisma.payment.findMany({
      where: { status: 'PENDING' },
      select: { id: true, orderRef: true, userId: true, planType: true, createdAt: true, customerName: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      select: { orderRef: true, userId: true, planType: true, completedAt: true, createdAt: true },
    }),
  ]);

  // Latest settlement per agent+plan.
  const settledAt = new Map();
  for (const p of settled) {
    const key = `${p.userId}::${p.planType}`;
    const at = (p.completedAt ?? p.createdAt).getTime();
    const prev = settledAt.get(key);
    if (!prev || at > prev.at) settledAt.set(key, { at, orderRef: p.orderRef });
  }

  const doomed = [];
  for (const p of open) {
    const hit = settledAt.get(`${p.userId}::${p.planType}`);
    // Strictly later, so a reference raised AFTER the last settlement is a
    // genuine renewal and is left alone.
    if (hit && hit.at > p.createdAt.getTime()) doomed.push({ ...p, replacedBy: hit.orderRef });
  }

  if (doomed.length === 0) {
    console.log(`${open.length} open reference(s); none of them are superseded. Nothing to do.`);
    return;
  }

  const byPerson = new Map();
  for (const d of doomed) {
    if (!byPerson.has(d.customerName)) byPerson.set(d.customerName, []);
    byPerson.get(d.customerName).push(d);
  }

  console.log(`${doomed.length} of ${open.length} open reference(s) are superseded:\n`);
  for (const [name, rows] of byPerson) {
    console.log(`  ${name} — ${rows.length}`);
    for (const r of rows.slice(0, 3)) {
      console.log(`      ${r.orderRef}  (${r.planType})  →  replaced by ${r.replacedBy}`);
    }
    if (rows.length > 3) console.log(`      …and ${rows.length - 3} more`);
  }

  if (!apply) {
    console.log('\nNothing changed. Re-run with --apply to close them.');
    return;
  }

  let closed = 0;
  for (const d of doomed) {
    await prisma.payment.update({
      where: { id: d.id },
      data: {
        status: 'CANCELLED',
        reviewedBy: 'system',
        reviewedAt: new Date(),
        reviewNote: `Superseded by ${d.replacedBy}, which settled.`,
      },
    });
    closed++;
  }

  console.log(`\nClosed ${closed} reference(s). They stay in the ledger, marked "Closed".`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
