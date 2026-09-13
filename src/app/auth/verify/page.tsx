 'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function VerifyPage() {
  const { t } = useLanguage();
  return <main className="flex min-h-screen items-center justify-center bg-[#F5F2EC] px-4"><div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-semibold text-[#13233F]">{t.auth.verificationTitle}</h1><p className="mt-3 text-sm text-[#5E6B7A]">{t.auth.verificationDesc}</p><Link href="/auth" className="mt-6 inline-flex rounded-lg bg-[#13233F] px-5 py-3 text-sm font-semibold !text-white">{t.auth.goToSignIn}</Link></div></main>;
}
