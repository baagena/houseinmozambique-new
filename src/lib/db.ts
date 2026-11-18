import { PrismaClient } from '@prisma/client';
import { purgeAfterWrite } from './public-cache';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('src/lib/db.ts: DATABASE_URL is not set. Prisma will fail to connect.');
}

let pool: pg.Pool | undefined;
try {
  // If the connection string requests SSL, provide a permissive setting to avoid
  // TLS handshake failures in some dev environments. This is safe for local
  // development but in production you should ensure proper CA verification.
  const useSsl = connectionString?.includes('sslmode=require') || connectionString?.includes('ssl=true');
  const poolOptions: any = { connectionString };
  if (useSsl && connectionString) {
    // pg lets ssl params parsed from the connection string override the `ssl`
    // option (and treats sslmode=require as verify-full), so a self-signed
    // server cert is rejected. Strip them so the explicit option applies.
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    url.searchParams.delete('ssl');
    poolOptions.connectionString = url.toString();
    poolOptions.ssl = { rejectUnauthorized: false };
  }

  /*
   * The database is a long way away: opening a connection (TCP + TLS) takes
   * about 6 s, a query about 0.25 s. pg's defaults were costing users that 6 s
   * over and over:
   *
   *  - idleTimeoutMillis defaults to 10 s, so after any quiet moment the next
   *    request reconnected from scratch. Keep idle connections for 5 minutes.
   *  - connectionTimeoutMillis defaults to 0 = wait forever, so a connect that
   *    stalled on the network hung the request for minutes (a search took
   *    162 s and the app showed "No internet"). Fail after 15 s instead; the
   *    read retry below then tries once more on a fresh connection.
   *  - keepAlive stops NAT/firewalls from silently dropping idle sockets.
   */
  poolOptions.idleTimeoutMillis = 5 * 60_000;
  poolOptions.connectionTimeoutMillis = 15_000;
  poolOptions.keepAlive = true;

  // One pool per process. In `next dev` this module re-runs on every reload,
  // and each run used to create a fresh pool; reuse the first one instead.
  const globalForPool = global as unknown as { pgPool?: pg.Pool };
  pool = globalForPool.pgPool ?? new pg.Pool(poolOptions);
  if (process.env.NODE_ENV !== 'production') globalForPool.pgPool = pool;
} catch (err) {
  console.error('src/lib/db.ts: failed to create pg Pool', err);
  // Rethrow so the error surfaces where prisma is instantiated.
  throw err;
}

const adapter = new PrismaPg(pool as pg.Pool);

// Bump this string after every `prisma db push && prisma generate` (i.e. any
// schema change) to force the dev server to drop its cached client on the next
// HMR cycle. Without this, an in-flight `next dev` keeps a stale PrismaClient
// that is missing newly added models and throws "Cannot read properties of
// undefined" until a full restart.
const SCHEMA_VERSION = '2026-11-13-push-devices';

type VersionedClient = PrismaClient & { __schemaVersion?: string };
const globalForPrisma = global as unknown as { prisma?: VersionedClient };

function createClient(): VersionedClient {
  const client = new PrismaClient({ adapter }) as VersionedClient;
  client.__schemaVersion = SCHEMA_VERSION;
  return client;
}

let base: VersionedClient;
try {
  const cached = globalForPrisma.prisma;
  const isStale = cached && cached.__schemaVersion !== SCHEMA_VERSION;
  base = !cached || isStale ? createClient() : cached;
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = base;
} catch (err) {
  console.error('src/lib/db.ts: failed to instantiate PrismaClient', err);
  throw err;
}

/*
 * A read that fails because the database could not be reached (a dropped
 * connection, a server still waking up) is tried once more before the page
 * gives up. Reads only: a write that lost its connection may already have
 * been applied, and running it twice is worse than reporting the failure.
 */
const READS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

/** Prisma's P1xxx codes are connection failures; P2024 is a pool timeout. */
function isConnectionError(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' && (code.startsWith('P1') || code === 'P2024');
}

/*
 * Public pages are cached (see src/app/[lang]/layout.tsx). Every write goes
 * through here, so this is the one place that tells the cache what changed —
 * whichever web route, mobile route, server action or helper made the write.
 * The rules for what counts are in ./public-cache.ts.
 */
const prisma = base.$extends({
  name: 'public-cache-purge',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        let result;
        try {
          result = await query(args);
        } catch (err) {
          if (!READS.has(operation) || !isConnectionError(err)) throw err;
          await new Promise((resolve) => setTimeout(resolve, 400));
          result = await query(args);
        }
        purgeAfterWrite(model, operation, args as { data?: unknown });
        return result;
      },
    },
  },
});

export { prisma };
