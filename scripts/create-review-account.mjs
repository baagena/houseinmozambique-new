/**
 * Creates the demo account Google Play reviewers sign in with.
 *
 * Play requires working credentials whenever an app puts anything behind a
 * login ("App access" in the Play Console). A reviewer who cannot get past the
 * sign-in screen rejects the submission, and that rejection costs a full review
 * cycle.
 *
 * WHICH DATABASE THIS HITS IS THE WHOLE POINT. The mobile app ships pointing at
 * https://www.houseinmozambique.com (see mobile/lib/core/network/api_config.dart),
 * so the reviewer's login goes to PRODUCTION. An account created in the
 * development database is invisible to them. Run this with DATABASE_URL set to
 * the database that domain talks to:
 *
 *   DATABASE_URL="postgres://…prod…" node scripts/create-review-account.mjs
 *
 * It is idempotent: run it again to reset the password before a resubmission,
 * or after a credential rotation.
 *
 * The account is deliberately an AGENT and never an ADMIN. A reviewer needs to
 * see the app work — browse, save, post a listing, read leads. They do not need
 * to approve listings, revoke other agents or read the whole user table, and a
 * standing ADMIN login whose password sits in a Play Console form is a poor
 * trade for showing them a moderation queue.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const EMAIL = process.env.REVIEW_EMAIL || 'play.review@houseinmozambique.com';
const PASSWORD = process.env.REVIEW_PASSWORD;

if (!PASSWORD) {
  console.error(
    'Set REVIEW_PASSWORD to the password you will type into the Play Console.\n'
    + '  REVIEW_PASSWORD=\'…\' node scripts/create-review-account.mjs\n\n'
    + 'Not defaulted on purpose: a password committed to this repository is a\n'
    + 'password on every machine that clones it, and this one is typed into a\n'
    + 'Google form and then lives until somebody rotates it.',
  );
  process.exit(1);
}

if (PASSWORD.length < 10) {
  console.error('Use at least 10 characters — this account is reachable from the public internet.');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const host = (() => {
  try { return new URL(url).host; } catch { return '(unparseable)'; }
})();

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  console.log(`Database: ${host}`);

  const existing = await prisma.agent.findUnique({
    where: { email: EMAIL },
    select: { id: true, role: true },
  });

  if (existing && existing.role === 'ADMIN') {
    console.error(
      `\n${EMAIL} already exists and is an ADMIN. Refusing to touch it — if that\n`
      + 'is genuinely the review account, demote it by hand first.',
    );
    process.exit(1);
  }

  const password = await bcrypt.hash(PASSWORD, 10);

  const agent = await prisma.agent.upsert({
    where: { email: EMAIL },
    // A resubmission usually just needs the password reset and the account
    // un-revoked; everything else about it should stay put.
    update: { password, role: 'AGENT', emailVerifiedAt: new Date() },
    create: {
      email: EMAIL,
      password,
      name: 'Play Store Review',
      initials: 'PR',
      title: 'Demo account',
      location: 'Maputo',
      bio: 'Read-only demo account for Google Play app review. Not a real agent.',
      role: 'AGENT',
      // Set so the reviewer can exercise the post-a-listing flow: createProperty
      // refuses any non-admin whose email is unverified, and no reviewer is
      // going to click a link in an inbox they do not have.
      emailVerifiedAt: new Date(),
      isVerified: false,
      isFeatured: false,
      specializations: [],
    },
    select: { id: true, email: true, role: true, emailVerifiedAt: true },
  });

  console.log(existing ? '\nUpdated existing review account.' : '\nCreated review account.');
  console.log(`  id              ${agent.id}`);
  console.log(`  email           ${agent.email}`);
  console.log(`  role            ${agent.role}`);
  console.log(`  emailVerifiedAt ${agent.emailVerifiedAt?.toISOString() ?? '(none)'}`);
  console.log('\nThe password is the REVIEW_PASSWORD you passed; it is not printed here.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
