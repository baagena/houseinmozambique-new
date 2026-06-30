import {
  getFeaturedProperties,
  getPropertiesByCity,
  getProperties,
  getFeaturedAgents,
} from '@/lib/data';
import { prisma } from '@/lib/db';
import HomeClient from '@/components/home/HomeClient';
import JsonLd from '@/components/seo/JsonLd';
import { faqJsonLd, HOME_FAQS } from '@/lib/seo';

export default async function HomePage() {
  const featured = await getFeaturedProperties();
  const featuredAgents = await getFeaturedAgents();
  const maputoProps = await getPropertiesByCity('Maputo');
  const inhamProps = await getPropertiesByCity('Inhambane');
  const beiraProps = await getPropertiesByCity('Beira');
  const nampulaProps = await getPropertiesByCity('Nampula');
  const teteProps = await getPropertiesByCity('Tete');
  const pembaProps = await getPropertiesByCity('Pemba');

  const allProperties = await getProperties();
  const rentProps = allProperties.filter((p) => p.listingType === 'Rent').slice(0, 8);
  const buyProps = allProperties.filter((p) => p.listingType === 'Buy').slice(0, 8);
  const shortStayProps = allProperties.filter((p) => p.listingType === 'Short Stay').slice(0, 8);

  const ads = await prisma.advertisement.findMany({
    where: { isActive: true },
    orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
  });

  return (
    <>
      <JsonLd data={faqJsonLd(HOME_FAQS)} />
      <HomeClient
      featured={featured as any}
      featuredAgents={featuredAgents as any}
      maputoProps={maputoProps as any}
      inhamProps={inhamProps as any}
      beiraProps={beiraProps as any}
      nampulaProps={nampulaProps as any}
      teteProps={teteProps as any}
      pembaProps={pembaProps as any}
      rentProps={rentProps as any}
      buyProps={buyProps as any}
      shortStayProps={shortStayProps as any}
      ads={ads as any}
    />
    </>
  );
}
