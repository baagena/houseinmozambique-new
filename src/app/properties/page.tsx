import { getProperties } from '@/lib/data';
import PropertiesClient from '@/components/properties/PropertiesClient';
import { Suspense } from 'react';

interface Props {
  searchParams: Promise<{
    type?: string;
    location?: string;
    propertyType?: string;
    isFeatured?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  
  // Fetch initial properties based on URL params if needed, 
  // but for the current interactive UI, we fetch all and let the client filter.
  const allProperties = await getProperties();

  return (
    <div className="pt-20 min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002045]" />
        </div>
      }>
        <PropertiesClient 
          initialProperties={allProperties as any} 
          initialType={params.type}
          initialLocation={params.location}
        />
      </Suspense>
    </div>
  );
}
