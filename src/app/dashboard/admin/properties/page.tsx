import { getPropertiesForAdmin } from '@/lib/data';
import AdminPropertiesClient, { type AdminProperty } from '@/components/dashboard/AdminPropertiesClient';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
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
    status: p.status,
    hostName: p.host ? p.host.name : 'System Generated',
  }));

  return <AdminPropertiesClient initialProperties={properties} />;
}
