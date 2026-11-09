import { getPropertiesForAdmin } from '@/lib/data';
import AdminPropertiesClient, { type AdminProperty } from '@/components/dashboard/AdminPropertiesClient';
import { requireAdmin } from '@/lib/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  // Layouts and pages render concurrently in RSC, so the guard in
  // dashboard/admin/layout.tsx does not stop this page's queries from running.
  // The check has to happen here, before any data is fetched.
  const admin = await requireAdmin();
  if (!admin) redirect('/auth');

  const allProperties = await getPropertiesForAdmin();

  const properties: AdminProperty[] = allProperties.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    city: p.city,
    neighborhood: p.neighborhood ?? '',
    address: p.address ?? '',
    price: p.price,
    priceUnit: p.priceUnit,
    type: p.type,
    listingType: p.listingType,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area,
    amenities: p.amenities ?? [],
    images: p.images ?? [],
    tags: p.tags ?? [],
    badge: p.badge ?? '',
    isFeatured: p.isFeatured,
    status: p.status,
    hostName: p.host ? p.host.name : 'System Generated',
    views: p.views,
    contactClicks: p.contactClicks,
    viewingClicks: p.viewingClicks,
  }));

  return <AdminPropertiesClient initialProperties={properties} />;
}
