import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { sweepSubscriptions } from '@/lib/entitlements';
import { sweepAddons } from '@/lib/listing-addons';
import { sweepExpiredRequests } from '@/lib/property-requests';
import { sweepFeaturePicks } from '@/lib/featured-slot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The periodic tidy-up: things whose state is a function of the clock.
 *
 * Three sweeps existed as functions and were called by nothing. A subscription
 * that lapsed stayed ACTIVE until something happened to touch it, a boost ran
 * for ever once paid for, and a buyer's two-month-old requirement stayed on the
 * agent board indefinitely. Each was written correctly and then never wired to
 * anything that would run it.
 *
 * Every read path here is defensive about exactly this — `subscriptionInForce`
 * reads the dates rather than trusting `status`, and the agent board filters on
 * `expiresAt` rather than on the status column — so a missed run degrades the
 * housekeeping, not the behaviour. This endpoint makes the housekeeping happen.
 *
 * Authenticated by a shared secret rather than a session, because the caller is
 * a scheduler and not a person. FAILS CLOSED: with no secret configured it
 * refuses, so an unprotected deployment cannot be driven by anyone who guesses
 * the path.
 *
 * Point a scheduler at it daily:
 *   curl -X POST https://…/api/maintenance -H "x-maintenance-key: $MAINTENANCE_SECRET"
 */

function secret(): string | null {
  return process.env.MAINTENANCE_SECRET || null;
}

/** Constant-time compare that never throws on a length mismatch. */
function matches(expected: string, provided: string): boolean {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function run() {
  /*
   * Each sweep is caught on its own. A failure in one — a bad row, a lock —
   * must not stop the other two: they are unrelated pieces of housekeeping
   * that happen to share a schedule.
   */
  const results: Record<string, number | string> = {};

  for (const [name, fn] of [
    ['subscriptions', async () => {
      const r = await sweepSubscriptions();
      // sweepSubscriptions reports what it changed; reduce to a count.
      return typeof r === 'number' ? r : Object.values(r ?? {}).reduce<number>(
        (sum, v) => sum + (Array.isArray(v) ? v.length : typeof v === 'number' ? v : 0), 0,
      );
    }],
    ['addons', sweepAddons],
    ['propertyRequests', sweepExpiredRequests],
    ['featurePicks', sweepFeaturePicks],
  ] as const) {
    try {
      results[name] = await fn();
    } catch (error) {
      console.error(`maintenance: ${name} sweep failed`, error);
      results[name] = error instanceof Error ? `failed: ${error.message}` : 'failed';
    }
  }

  return results;
}

export async function POST(req: Request) {
  const key = secret();
  if (!key) {
    console.error(
      'maintenance: MAINTENANCE_SECRET is not configured — refusing. Set it and give the '
      + 'scheduler the same value.',
    );
    return NextResponse.json({ error: 'Maintenance is not configured' }, { status: 503 });
  }

  const provided =
    req.headers.get('x-maintenance-key')
    // Also accepted as a bearer token, which is what most schedulers send.
    || (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
    || '';

  if (!provided || !matches(key, provided.trim())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const started = Date.now();
  const swept = await run();

  console.log(`maintenance: ${JSON.stringify(swept)} in ${Date.now() - started}ms`);
  return NextResponse.json({ ok: true, swept, ms: Date.now() - started });
}

/**
 * A signed GET, for schedulers that cannot send a header.
 *
 * The signature covers the day, so a URL that leaks is useless tomorrow —
 * which a bare `?key=` in a query string, sitting in every access log along the
 * way, would not be.
 */
export async function GET(req: Request) {
  const key = secret();
  if (!key) return NextResponse.json({ error: 'Maintenance is not configured' }, { status: 503 });

  const token = new URL(req.url).searchParams.get('t') ?? '';
  const today = new Date().toISOString().slice(0, 10);
  const expected = createHmac('sha256', key).update(today).digest('hex');

  if (!token || !matches(expected, token)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const swept = await run();
  return NextResponse.json({ ok: true, swept });
}
