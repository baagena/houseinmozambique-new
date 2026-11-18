import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';
import { defaultFlatContent } from '@/lib/content';

/**
 * The "Edit pages" data (web: dashboard/admin/content): every editable site
 * text key with its built-in default and any saved override, per language.
 * Saving goes to the shared POST /api/admin/content.
 */
export async function GET(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const overrides: { en: Record<string, string>; pt: Record<string, string> } = { en: {}, pt: {} };
  const rows = await prisma.siteContent.findMany({ select: { key: true, lang: true, value: true } });
  for (const row of rows) {
    if (row.lang === 'en' || row.lang === 'pt') overrides[row.lang][row.key] = row.value;
  }

  return NextResponse.json({ defaults: defaultFlatContent, overrides });
}
