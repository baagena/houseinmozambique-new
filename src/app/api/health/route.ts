import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Liveness + database check for the Docker healthcheck and uptime monitors.
 * 200 when the app and its database answer; 503 when the database does not.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: 'up' });
  } catch {
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 });
  }
}
