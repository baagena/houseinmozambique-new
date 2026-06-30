import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { defaultFlatContent } from '@/lib/content';

async function requireAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { error: 'Not authenticated', status: 401 as const };
  }

  const admin = await prisma.agent.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Forbidden - admins only', status: 403 as const };
  }

  return { userId };
}

function isValidLang(lang: unknown): lang is 'en' | 'pt' {
  return lang === 'en' || lang === 'pt';
}

// GET — return all overrides grouped by language as flat dot-path maps.
export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rows = await prisma.siteContent.findMany({
      select: { key: true, lang: true, value: true },
    });

    const overrides: { en: Record<string, string>; pt: Record<string, string> } = { en: {}, pt: {} };
    for (const row of rows) {
      if (isValidLang(row.lang)) overrides[row.lang][row.key] = row.value;
    }

    return NextResponse.json({ success: true, overrides });
  } catch (error) {
    console.error('Admin content GET error:', error);
    return NextResponse.json({ error: 'Failed to load content.' }, { status: 500 });
  }
}

// POST — batch upsert/reset overrides.
// Body: { updates: [{ key, lang, value }] }. An empty/whitespace value resets
// that key (deletes the override so the in-code default is used again).
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const updates = Array.isArray(body.updates) ? body.updates : [];

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const ops = [];
    for (const update of updates) {
      const key = String(update.key || '').trim();
      const lang = update.lang;
      if (!key || !isValidLang(lang)) continue;

      // Only accept keys that exist in the default content (prevents junk rows).
      if (!(key in defaultFlatContent[lang])) continue;

      const rawValue = typeof update.value === 'string' ? update.value : '';
      const value = rawValue.trim();
      const isDefault = value === defaultFlatContent[lang][key];

      if (value.length === 0 || isDefault) {
        // Reset: remove any override so the default applies.
        ops.push(
          prisma.siteContent.deleteMany({ where: { key, lang } })
        );
      } else {
        ops.push(
          prisma.siteContent.upsert({
            where: { key_lang: { key, lang } },
            create: { key, lang, value },
            update: { value },
          })
        );
      }
    }

    if (ops.length === 0) {
      return NextResponse.json({ error: 'No valid updates.' }, { status: 400 });
    }

    await prisma.$transaction(ops);

    // Content is rendered through the root layout everywhere — revalidate all.
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, count: ops.length });
  } catch (error) {
    console.error('Admin content POST error:', error);
    return NextResponse.json({ error: 'Failed to save content.' }, { status: 500 });
  }
}
