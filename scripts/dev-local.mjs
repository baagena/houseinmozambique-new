// Runs the website + API against the LOCAL test copy of the database, for
// testing the mobile app on a phone without touching real data.
//
//   npm run dev:local
//
// What it changes, for this process only (.env is not modified):
//   - DATABASE_URL → the local copy on this PC (localhost:5433/house_local)
//   - EMAIL_MODE=log → emails are printed here, never sent (the copy holds
//     real customers' addresses)
//   - its own JWT/session keys, so local sign-ins never work on the live API
//   - payment gateways, push notifications and the website's Google
//     Analytics tag are switched off
// Photo uploads still go to Cloudinary, so listing photos work.
//
// The local database must be running; start it with:
//   "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D ..\local-pg\data -l ..\local-pg\server.log start

import { spawn } from 'node:child_process';
import net from 'node:net';

const LOCAL_DB = 'postgresql://postgres@localhost:5433/house_local';
const PORT = process.env.PORT || '3005';

const reachable = await new Promise((resolve) => {
  const s = net.connect(5433, '127.0.0.1');
  s.once('connect', () => { s.end(); resolve(true); });
  s.once('error', () => resolve(false));
});
if (!reachable) {
  console.error('The local test database is not running on localhost:5433. Start it first (see the top of scripts/dev-local.mjs).');
  process.exit(1);
}

const env = {
  ...process.env,
  DATABASE_URL: LOCAL_DB,
  EMAIL_MODE: 'log',
  // Local-only signing keys. Every account in the local copy shares one test
  // password; with the live keys, a token from a local sign-in would also be
  // accepted by the live API. With these, local sign-ins work only here.
  JWT_SECRET: 'local-test-only-jwt-not-valid-in-production',
  SESSION_SECRET: 'local-test-only-session-not-valid-in-production',
  // Next only fills variables that are not already set, so empty strings here
  // win over the real keys in .env.
  RESEND_API_KEY: '',
  SENDGRID_API_KEY: '',
  MPESA_API_KEY: '',
  EMOLA_API_KEY: '',
  STRIPE_API_KEY: '',
  FIREBASE_SERVICE_ACCOUNT: '',
  NEXT_PUBLIC_GA_ID: '',
};

console.log(`\nLocal test server → http://localhost:${PORT}  (database: local copy, emails: printed only)\n`);
const child = spawn('npx', ['next', 'dev', '-p', PORT, '-H', '0.0.0.0'], { env, stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
