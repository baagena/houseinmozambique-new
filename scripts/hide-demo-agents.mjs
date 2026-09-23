/**
 * Keep demo, test and store-review accounts out of the public agent directory.
 *
 * /agents was showing "Play Store Review" alongside real agencies. A visitor
 * cannot tell an internal account from a small agency — they find out by
 * ringing a number nobody answers, which is the kind of thing a marketplace
 * only gets to do to somebody once.
 *
 * Hiding does NOT disable anything. The account keeps every ability it has,
 * including posting; it is simply not advertised. Reversible from the admin
 * console: Agents → edit → "Hide from directory".
 *
 *   node scripts/hide-demo-agents.mjs            # report only, changes nothing
 *   node scripts/hide-demo-agents.mjs --apply    # flag the accounts listed
 *   node scripts/hide-demo-agents.mjs --apply a@b.com c@d.com
 *   node scripts/hide-demo-agents.mjs --show --apply a@b.com   # put one back
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const show = argv.includes('--show');
const emails = argv.filter((a) => !a.startsWith('--')).map((a) => a.toLowerCase());

/**
 * What marks an account as not-a-real-agent.
 *
 * Deliberately narrow. A false positive here removes a paying agent from the
 * directory silently, which is far worse than leaving one demo row visible for
 * another day — so anything borderline is reported and left alone.
 */
const DEMO_PATTERNS = [
  /@example\.(com|org|net)$/i,
  /^(test|demo|dev|qa|sample|dummy)[.\-_+]/i,
  /\b(play\.review|appstore|store\.review)\b/i,
];
const DEMO_NAMES = /\b(test|demo|dummy|sample|play store|app store|store review|qa)\b/i;

function looksLikeDemo(agent) {
  return (
    DEMO_PATTERNS.some((re) => re.test(agent.email)) ||
    DEMO_NAMES.test(agent.name)
  );
}

const agents = await prisma.agent.findMany({
  where: { role: 'AGENT' },
  select: {
    id: true, name: true, email: true, isHidden: true,
    _count: { select: { properties: true } },
  },
  orderBy: { createdAt: 'asc' },
});

// An explicit list on the command line always wins over the heuristic.
const targets = emails.length
  ? agents.filter((a) => emails.includes(a.email.toLowerCase()))
  : agents.filter((a) => looksLikeDemo(a) && !a.isHidden);

console.log(`\n${agents.length} agent account(s) eligible for the public directory:\n`);
for (const a of agents) {
  const mark = targets.some((t) => t.id === a.id) ? (show ? ' <- SHOW' : ' <- HIDE') : '';
  console.log(
    `  ${a.isHidden ? 'hidden ' : 'listed '} ${String(a._count.properties).padStart(3)} listing(s)  ` +
    `${a.name} <${a.email}>${mark}`,
  );
}

if (emails.length) {
  const missing = emails.filter((e) => !agents.some((a) => a.email.toLowerCase() === e));
  for (const e of missing) console.log(`\n  ! no AGENT account with email ${e}`);
}

if (targets.length === 0) {
  console.log('\nNothing to change.\n');
} else if (!apply) {
  console.log(
    `\n${targets.length} account(s) would be ${show ? 'shown' : 'hidden'}. ` +
    'Re-run with --apply to write.\n',
  );
} else {
  const result = await prisma.agent.updateMany({
    where: { id: { in: targets.map((t) => t.id) } },
    data: { isHidden: !show },
  });
  console.log(`\n${result.count} account(s) ${show ? 'restored to' : 'removed from'} the directory.\n`);
}

await prisma.$disconnect();
