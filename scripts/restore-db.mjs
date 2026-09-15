/**
 * Restore rows from a backup produced by scripts/backup-db.mjs.
 *
 * Safety posture, deliberately conservative:
 *   - DRY RUN BY DEFAULT. It reports what it would change and writes nothing
 *     unless you pass --confirm.
 *   - It NEVER deletes. Rows that exist in the database but not in the backup
 *     are left alone, so restoring an old backup cannot wipe newer listings.
 *   - It upserts by primary key, so re-running it is idempotent.
 *
 * This matches the real use case: a client's listing was lost, and you want it
 * put back without disturbing everything created since.
 *
 *   node scripts/restore-db.mjs backups/backup-....json              # dry run
 *   node scripts/restore-db.mjs backups/backup-....json --confirm    # apply
 *   node scripts/restore-db.mjs backups/backup-....json --table Property
 *   node scripts/restore-db.mjs backups/backup-....json --missing-only --confirm
 *
 * --missing-only re-inserts deleted rows but does not overwrite rows that still
 * exist, which is usually what you want after an accidental delete.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const CONFIRM = args.includes('--confirm');
const MISSING_ONLY = args.includes('--missing-only');
const onlyTable = (() => {
  const i = args.indexOf('--table');
  return i >= 0 ? args[i + 1] : null;
})();

function equalRow(a, b) {
  // Compare via the same JSON projection the backup used, so Date vs string
  // differences do not read as changes.
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main() {
  if (!file) {
    console.error('Usage: node scripts/restore-db.mjs <backup.json> [--confirm] [--missing-only] [--table Name]');
    process.exit(1);
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const payload = JSON.parse(readFileSync(resolve(file), 'utf8'));
  const { meta, data } = payload;

  const target = new URL(connectionString);
  console.log(`backup taken : ${meta.takenAt}`);
  console.log(`backup source: ${meta.database} @ ${meta.host}`);
  console.log(`restore target: ${target.pathname.slice(1)} @ ${target.hostname}`);
  if (meta.host !== target.hostname || meta.database !== target.pathname.slice(1)) {
    console.log('NOTE: restoring into a DIFFERENT database than the backup came from.');
  }
  console.log(CONFIRM ? '\nMODE: APPLY (writes will happen)\n' : '\nMODE: DRY RUN (nothing will be written)\n');

  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const tables = (meta.tableOrder || Object.keys(data)).filter(
    (t) => !onlyTable || t === onlyTable
  );

  let totalInsert = 0;
  let totalUpdate = 0;

  for (const table of tables) {
    const rows = data[table] || [];
    if (rows.length === 0) {
      console.log(`  ${table}: backup has no rows, skipping`);
      continue;
    }

    const { rows: existingRows } = await pool.query(`select * from "${table}"`);
    const existing = new Map(existingRows.map((r) => [String(r.id), r]));

    const toInsert = [];
    const toUpdate = [];
    for (const row of rows) {
      const current = existing.get(String(row.id));
      if (!current) toInsert.push(row);
      else if (!MISSING_ONLY && !equalRow(JSON.parse(JSON.stringify(current)), row)) toUpdate.push(row);
    }

    console.log(
      `  ${table}: ${toInsert.length} missing to re-insert, ` +
        `${toUpdate.length} differing to overwrite` +
        (MISSING_ONLY ? ' (skipped: --missing-only)' : '')
    );
    totalInsert += toInsert.length;
    totalUpdate += toUpdate.length;

    if (!CONFIRM) continue;

    for (const row of [...toInsert, ...toUpdate]) {
      const cols = Object.keys(row);
      const vals = cols.map((c) => row[c]);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const quoted = cols.map((c) => `"${c}"`).join(', ');
      const updates = cols
        .filter((c) => c !== 'id')
        .map((c) => `"${c}" = EXCLUDED."${c}"`)
        .join(', ');

      const sql =
        `insert into "${table}" (${quoted}) values (${placeholders}) ` +
        (updates ? `on conflict ("id") do update set ${updates}` : `on conflict ("id") do nothing`);

      try {
        await pool.query(sql, vals);
      } catch (err) {
        console.error(`    FAILED ${table} id=${row.id}: ${err.message}`);
      }
    }
  }

  console.log(
    `\n${CONFIRM ? 'Applied' : 'Would apply'}: ${totalInsert} insert(s), ${totalUpdate} overwrite(s). ` +
      'No rows were deleted.'
  );
  if (!CONFIRM && (totalInsert || totalUpdate)) {
    console.log('Re-run with --confirm to write these changes.');
  }
  await pool.end();
}

main().catch((err) => {
  console.error('Restore failed:', err);
  process.exit(1);
});
