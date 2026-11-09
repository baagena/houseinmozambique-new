import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import AdvertisingServiceClient from '@/components/services/AdvertisingServiceClient';

export const metadata: Metadata = buildMetadata({
  title: 'Property & Real Estate Advertising',
  description:
    'Advertise residential, commercial, industrial and investment property on House in Mozambique — a full listing page, category placement, featured slots, and enquiries routed to your dashboard.',
  path: '/services/property-advertising',
  keywords: [
    'property advertising Mozambique',
    'advertise house Mozambique',
    'real estate marketing Maputo',
  ],
});

export default function PropertyAdvertisingPage() {
  return <AdvertisingServiceClient />;
}
