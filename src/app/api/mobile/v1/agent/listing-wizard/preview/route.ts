import { NextResponse } from 'next/server';
import { requireBearerAgent } from '@/lib/mobile-auth';
import { generateListing } from '@/lib/listing-copy';
import { isShortMapLink, looksOutsideMozambique, parseLatLng } from '@/lib/geo';
import { normalizeAnswers, wizardBlockers } from '@/lib/mobile-listing-wizard';

/**
 * The live preview: answers in, the listing the site would publish out.
 *
 * Also resolves a pasted Google Maps link or "lat, lng" into a pin, using the
 * same parser as the web wizard, so the app never has to.
 */
export async function POST(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const lang = body.lang === 'en' ? 'en' : 'pt';
  const answers = normalizeAnswers(body.answers);

  let pin: { lat: number; lng: number; outsideMozambique: boolean } | null = null;
  let pinError: 'short' | 'none' | null = null;
  if (typeof body.mapLink === 'string' && body.mapLink.trim()) {
    const parsed = parseLatLng(body.mapLink);
    if (parsed) {
      pin = { ...parsed, outsideMozambique: looksOutsideMozambique(parsed) };
      answers.lat = parsed.lat;
      answers.lng = parsed.lng;
    } else {
      pinError = isShortMapLink(body.mapLink) ? 'short' : 'none';
    }
  }

  const g = generateListing(answers);
  return NextResponse.json({
    title: lang === 'pt' ? g.titlePt : g.title,
    description: lang === 'pt' ? g.ptDesc : g.enDesc,
    meta: lang === 'pt' ? g.metaPt : g.meta,
    slug: g.ptSlug || g.slug,
    score: g.score,
    band: g.band,
    missing: g.missing,
    blockers: wizardBlockers(answers, lang),
    pin,
    pinError,
  });
}
