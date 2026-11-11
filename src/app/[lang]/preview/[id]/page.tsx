import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPropertyById, getSimilarProperties } from '@/lib/data';
import { getSession } from '@/lib/session';
import { resolvePropertyRef } from '@/lib/property-slug';
import PropertyDetailClient from '@/components/properties/PropertyDetailClient';
import { localizedPath, toSiteLang } from '@/lib/site-lang';

/**
 * A listing as its own agent and staff see it, whatever its status.
 *
 * The public page (/properties/<slug>) is cached and shared by every visitor,
 * so it only ever shows published listings. Drafts, listings waiting for
 * review, rejected and suspended ones are opened here instead, where the
 * visitor is checked on every request.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Listing preview',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ lang: string; id: string }>;
}

export default async function PropertyPreviewPage({ params }: Props) {
  const { id: ref, lang } = await params;
  const here = localizedPath(`/preview/${ref}`, toSiteLang(lang));

  const session = await getSession();
  if (!session) redirect(`/auth?redirect=${encodeURIComponent(here)}`);

  const resolved = await resolvePropertyRef(ref);
  if (!resolved) notFound();

  const property = await getPropertyById(resolved.id);
  if (!property) notFound();

  const canPreview = session.role === 'ADMIN' || session.id === property.hostId;
  if (!canPreview) notFound();

  // Published: the public page is the real one.
  if (property.status === 'PUBLISHED') {
    redirect(localizedPath(`/properties/${property.slug ?? property.id}`, toSiteLang(lang)));
  }

  const similar = await getSimilarProperties(property, 4);

  return <PropertyDetailClient property={property} similar={similar} />;
}
