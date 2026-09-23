import {
  getFeaturedProperties,
  getProperties,
  getFeaturedAgents,
} from '@/lib/data';
import { featuredSlot } from '@/lib/featured-slot';
import { prisma } from '@/lib/db';
import HomeClient, { type CategoryCount, type CityCount } from '@/components/home/HomeClient';
import JsonLd from '@/components/seo/JsonLd';
import { faqJsonLd, HOME_FAQS } from '@/lib/seo';
import { sanitizeProperties } from '@/lib/mobile-serialize';

/**
 * Cities shown in the "Explore Mozambique" grid. The counts are read from the
 * live listings below — only cities that actually have properties are rendered.
 */
const CITY_IMAGES: Record<string, string> = {
  Maputo: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=900&auto=format&fit=crop',
  Beira: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=900&auto=format&fit=crop',
  Pemba: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=900&auto=format&fit=crop',
  Inhambane: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?q=80&w=900&auto=format&fit=crop',
  Nampula: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=900&auto=format&fit=crop',
  Tete: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?q=80&w=900&auto=format&fit=crop',
  Matola: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=900&auto=format&fit=crop',
  Quelimane: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=900&auto=format&fit=crop',
};

const FALLBACK_CITY_IMAGE =
  'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=900&auto=format&fit=crop';

export default async function HomePage() {
  const featured = await getFeaturedProperties();
  /*
   * The featured SLOT is chosen separately from the featured GRID.
   *
   * `isFeatured` is an editorial flag on many properties; the slot is one
   * property with a reason attached. featuredSlot() applies the eligibility
   * and fallback rules and returns null when nothing clears the bar, in which
   * case the block is removed from the page rather than rendered empty.
   */
  const slot = await featuredSlot();
  const featuredAgents = await getFeaturedAgents();
  const allProperties = await getProperties();

  const rentProps = allProperties.filter((p) => p.listingType === 'Rent').slice(0, 6);
  const buyProps = allProperties.filter((p) => p.listingType === 'Buy').slice(0, 6);
  const shortStayProps = allProperties.filter((p) => p.listingType === 'Short Stay').slice(0, 6);
  /* Eight: the grid is four across at full width, so six left a half-empty
     second row. Two complete rows read as a selection; one and a half reads
     as a page that ran out. */
  const latest = allProperties.slice(0, 8);

  // Chip counts come from the live listings, never hardcoded.
  const countBy = (predicate: (p: (typeof allProperties)[number]) => boolean) =>
    allProperties.filter(predicate).length;

  const categories: CategoryCount[] = [
    { label: 'Featured', count: featured.length, href: '/properties?isFeatured=true' },
    { label: 'For sale', count: countBy((p) => p.listingType === 'Buy'), href: '/properties?type=Buy' },
    { label: 'For rent', count: countBy((p) => p.listingType === 'Rent'), href: '/properties?type=Rent' },
    {
      label: 'Short stay',
      count: countBy((p) => p.listingType === 'Short Stay'),
      href: '/properties?type=Short+Stay',
    },
    { label: 'Auction', count: countBy((p) => p.listingType === 'Auction'), href: '/properties?type=Auction' },
    { label: 'Villas', count: countBy((p) => p.type === 'Villa'), href: '/properties?propertyType=Villa' },
    {
      label: 'Apartments',
      count: countBy((p) => p.type === 'Apartment'),
      href: '/properties?propertyType=Apartment',
    },
    { label: 'Land', count: countBy((p) => p.type === 'Land'), href: '/properties?propertyType=Land' },
  ];

  const cityCounts = new Map<string, number>();
  for (const p of allProperties) {
    if (!p.city) continue;
    cityCounts.set(p.city, (cityCounts.get(p.city) || 0) + 1);
  }
  const cityNames = new Set([...Object.keys(CITY_IMAGES), ...cityCounts.keys()]);
  const cities: CityCount[] = [...cityNames]
    .sort((a, b) => (cityCounts.get(b) || 0) - (cityCounts.get(a) || 0) || a.localeCompare(b))
    .slice(0, 8)
    .map((name) => ({
      name,
      count: cityCounts.get(name) || 0,
      image: CITY_IMAGES[name] || FALLBACK_CITY_IMAGE,
      href: `/properties?location=${encodeURIComponent(name)}`,
    }));

  const ads = await prisma.advertisement.findMany({
    where: { isActive: true },
    orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
  });

  return (
    <>
      <JsonLd data={faqJsonLd(HOME_FAQS)} />
      <HomeClient
        slot={slot && {
          property: sanitizeProperties([slot.property as never])[0] as never,
          kind: slot.kind,
          note: slot.note,
          notePt: slot.notePt,
          reviewerName: slot.reviewerName,
        }}
        featuredAgents={featuredAgents as any}
        latest={sanitizeProperties(latest) as any}
        cities={cities}
        categories={categories}
        rentProps={sanitizeProperties(rentProps) as any}
        buyProps={sanitizeProperties(buyProps) as any}
        shortStayProps={sanitizeProperties(shortStayProps) as any}
        ads={ads as any}
      />
    </>
  );
}
