// One-off: inspect or migrate the database named by the COMMENTED-OUT
// DATABASE_URL on line 1 of .env (the one the live site uses), over a
// verified TLS connection. Never prints the connection string.
//
//   node scripts/live-db-migrate.mjs check
//   node scripts/live-db-migrate.mjs apply <file.sql> [<file.sql> …]
import { readFileSync } from 'node:fs';
import pg from 'pg';

const line = readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)[0];
const url = line.replace(/^#\s*DATABASE_URL=/, '').replace(/^"|"$/g, '').trim();
if (!url.startsWith('postgres')) throw new Error('Line 1 of .env is not a commented DATABASE_URL.');

// pg reads sslmode from the URL; keep verification on (Node's own CA store).
const client = new pg.Client({
  connectionString: url.replace(/[?&](sslmode|channel_binding)=[^&]*/g, '').replace(/[?&]$/, ''),
  ssl: { rejectUnauthorized: true },
  connectionTimeoutMillis: 60_000,
});

const host = new URL(url).hostname;
const [mode, ...files] = process.argv.slice(2);

await client.connect();
console.log(`connected to ${host}`);

async function check() {
  const q = async (label, sql) => console.log(`  ${label}: ${(await client.query(sql)).rows[0].v}`);
  await q('agents', 'select count(*)::text as v from "Agent"');
  await q('published listings', `select count(*)::text as v from "Property" where status='PUBLISHED'`);
  await q('newest listing', 'select max("createdAt")::date::text as v from "Property"');
  await q('PushDevice table exists', `select (to_regclass('public."PushDevice"') is not null)::text as v`);
  await q('Agent.whatsapp exists', `select exists(select 1 from information_schema.columns where table_name='Agent' and column_name='whatsapp')::text as v`);
  await q('Agent.socialLinks exists', `select exists(select 1 from information_schema.columns where table_name='Agent' and column_name='socialLinks')::text as v`);
  await q('ContactEvent.propertyId nullable', `select is_nullable as v from information_schema.columns where table_name='ContactEvent' and column_name='propertyId'`);
}

try {
  if (mode === 'check') {
    await check();
  } else if (mode === 'apply' && files.length) {
    for (const file of files) {
      const sql = readFileSync(file, 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('commit');
        console.log(`applied ${file}`);
      } catch (e) {
        await client.query('rollback');
        throw e;
      }
    }
    await check();
  } else {
    console.log('usage: check | apply <file.sql>…');
  }
} finally {
  await client.end();
}
