/**
 * POST /api/property/draft — turn an agent's prose into a listing draft.
 *
 * Drafts only. This never writes to the database and never publishes: the
 * response goes into a form the agent corrects, and the existing approval flow
 * is untouched.
 *
 * Each call costs money, so it is behind the session guard and a small
 * per-agent rate limit.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { draftListing, draftingAvailable } from '@/lib/listing-draft';

export const runtime = 'nodejs';

const MIN_CHARS = 40;
const MAX_CHARS = 6000;

/** Per-agent throttle. In-process on purpose — it resets on deploy, which is
 *  fine for a cost guard on an authenticated, low-volume action. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(agentId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(agentId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(agentId, recent);
    return true;
  }
  recent.push(now);
  hits.set(agentId, recent);
  return false;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!draftingAvailable()) {
    return NextResponse.json(
      { error: 'Listing drafting is not configured on this environment.', code: 'not_configured' },
      { status: 503 },
    );
  }

  if (rateLimited(session.id)) {
    return NextResponse.json(
      { error: 'Too many drafts in a row. Give it a minute.', code: 'rate_limited' },
      { status: 429 },
    );
  }

  let sourceText: unknown;
  try {
    ({ sourceText } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  if (typeof sourceText !== 'string' || sourceText.trim().length < MIN_CHARS) {
    return NextResponse.json(
      { error: `Write at least ${MIN_CHARS} characters about the property.`, code: 'too_short' },
      { status: 400 },
    );
  }
  if (sourceText.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `That is longer than ${MAX_CHARS} characters. Trim it down.`, code: 'too_long' },
      { status: 400 },
    );
  }

  try {
    const draft = await draftListing(sourceText.trim());
    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Listing draft failed:', error);
    return NextResponse.json(
      { error: 'Could not draft the listing. Your text is still here — try again.', code: 'draft_failed' },
      { status: 502 },
    );
  }
}
