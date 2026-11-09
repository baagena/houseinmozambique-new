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
  if (useSsl) poolOptions.ssl = { rejectUnauthorized: false };

  pool = new pg.Pool(poolOptions);
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
const SCHEMA_VERSION = '2026-10-18-corporate-agency-profiles';

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
        const result = await query(args);
        purgeAfterWrite(model, operation, args as { data?: unknown });
        return result;
      },
    },
  },
});

export { prisma };
