/**
 * Full database backup to a timestamped JSON file.
 *
 * Read-only: it runs SELECTs and nothing else, so it is always safe to run,
 * including against production.
 *
 *   node scripts/backup-db.mjs                  # back up DATABASE_URL
 *   node scripts/backup-db.mjs --out my.json    # choose the file name
 *   DATABASE_URL=<other> node scripts/backup-db.mjs
 *
 * Output lands in backups/ which is gitignored — a backup contains password
 * hashes, reset tokens and customer contact details, so it must never be
 * committed or shared.
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import pg from 'pg';

// Parents before children, so a restore can insert in this order directly.
const TABLE_ORDER = [
  'Agent',
  'Property',
  'Inquiry',
  'InquiryReply',
  'BlogPost',
  'Favorite',
  'Advertisement',
  'AppSetting',
  'PricingPlan',
  'SiteContent',
  'Subscriber',
  'Payment',
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const host = new URL(connectionString).hostname;
  const database = new URL(connectionString).pathname.slice(1);

  // Discover tables so a newly added model is never silently skipped.
  const { rows: present } = await pool.query(
    `select table_name from information_schema.tables
      where table_schema='public' and table_type='BASE TABLE'`
  );
  const names = present.map((r) => r.table_name);
  const ordered = [
    ...TABLE_ORDER.filter((t) => names.includes(t)),
    ...names.filter((t) => !TABLE_ORDER.includes(t)).sort(),
  ];

  const unknown = names.filter((t) => !TABLE_ORDER.includes(t));
  if (unknown.length) {
    console.warn(
      `note: ${unknown.join(', ')} not in TABLE_ORDER — appended last. ` +
        'If it has foreign keys, add it to TABLE_ORDER so restores order correctly.'
    );
  }

  const data = {};
  const counts = {};
  for (const table of ordered) {
    const { rows } = await pool.query(`select * from "${table}"`);
    data[table] = rows;
    counts[table] = rows.length;
    console.log(`  ${String(rows.length).padStart(6)}  ${table}`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = resolve(arg('--out') || `backups/backup-${stamp}.json`);
  mkdirSync(dirname(outPath), { recursive: true });

  const payload = {
    meta: {
      takenAt: new Date().toISOString(),
      host,
      database,
      tableOrder: ordered,
      counts,
      totalRows: Object.values(counts).reduce((a, b) => a + b, 0),
    },
    data,
  };

  writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\nBacked up ${payload.meta.totalRows} rows from ${ordered.length} tables`);
  console.log(`  source: ${database} @ ${host}`);
  console.log(`  file:   ${outPath}`);
  await pool.end();
}

main().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
