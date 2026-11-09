import { prisma } from '@/lib/db';
import { defaultFlatContent } from '@/lib/content';
import AdminContentClient from '@/components/dashboard/AdminContentClient';
import { requireAdmin } from '@/lib/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  // Layouts and pages render concurrently in RSC, so the guard in
  // dashboard/admin/layout.tsx does not stop this page's queries from running.
  // The check has to happen here, before any data is fetched.
  const admin = await requireAdmin();
  if (!admin) redirect('/auth');

  let overrides: { en: Record<string, string>; pt: Record<string, string> } = { en: {}, pt: {} };

  try {
    const rows = await prisma.siteContent.findMany({
      select: { key: true, lang: true, value: true },
    });
    for (const row of rows) {
      const lang = row.lang === 'pt' ? 'pt' : 'en';
      overrides[lang][row.key] = row.value;
    }
  } catch (error) {
    console.error('AdminContentPage: failed to load overrides', error);
  }

  return (
    <AdminContentClient defaults={defaultFlatContent} overrides={overrides} />
  );
}
