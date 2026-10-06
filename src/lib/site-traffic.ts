import { prisma } from '@/lib/db';

/**
 * Website traffic for the admin dashboard.
 *
 * Every public page load sends a beacon (components/layout/VisitTracker.tsx)
 * to POST /api/visit, which skips bots and staff and records one pageview,
 * plus one visitor the first time a browser shows up on a given day — known
 * from a cookie that holds nothing but that day's date. Days are counted in
 * Maputo time (UTC+2, no daylight saving) so "today" matches the team's day.
 */

const MAPUTO_OFFSET_MS = 2 * 60 * 60 * 1000;

/** "2026-10-06" for the Maputo calendar day containing `at`. */
export function maputoDay(at: Date = new Date()): string {
  return new Date(at.getTime() + MAPUTO_OFFSET_MS).toISOString().slice(0, 10);
}

export const VISIT_COOKIE = 'hv_day';

/** One pageview, and a visitor if this browser has not been seen today. */
export async function recordVisit(newVisitor: boolean, day = maputoDay()): Promise<void> {
  const visitors = newVisitor ? 1 : 0;
  await prisma.$executeRaw`
    INSERT INTO "SiteTrafficDay" ("day", "visitors", "pageviews", "updatedAt")
    VALUES (${day}, ${visitors}, 1, NOW())
    ON CONFLICT ("day") DO UPDATE SET
      "visitors" = "SiteTrafficDay"."visitors" + ${visitors},
      "pageviews" = "SiteTrafficDay"."pageviews" + 1,
      "updatedAt" = NOW()`;
}

export interface TrafficSummary {
  today: { visitors: number; pageviews: number };
  last7: { visitors: number; pageviews: number };
  last30: { visitors: number; pageviews: number };
  /** Oldest day with data, so the dashboard can say "counting since …". */
  since: string | null;
  /** Last 30 days, oldest first, zero-filled. */
  daily: { day: string; visitors: number; pageviews: number }[];
}

export async function getTrafficSummary(): Promise<TrafficSummary> {
  const today = maputoDay();
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) days.push(maputoDay(new Date(Date.now() - i * 86_400_000)));

  const [rows, first] = await Promise.all([
    prisma.siteTrafficDay.findMany({ where: { day: { gte: days[0] } } }),
    prisma.siteTrafficDay.findFirst({ orderBy: { day: 'asc' }, select: { day: true } }),
  ]);
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const daily = days.map((day) => ({
    day,
    visitors: byDay.get(day)?.visitors ?? 0,
    pageviews: byDay.get(day)?.pageviews ?? 0,
  }));

  const sum = (list: typeof daily) => ({
    visitors: list.reduce((n, d) => n + d.visitors, 0),
    pageviews: list.reduce((n, d) => n + d.pageviews, 0),
  });

  return {
    today: sum(daily.filter((d) => d.day === today)),
    last7: sum(daily.slice(-7)),
    last30: sum(daily),
    since: first?.day ?? null,
    daily,
  };
}
