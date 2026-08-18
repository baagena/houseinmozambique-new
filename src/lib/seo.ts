import type { Metadata } from 'next';

/**
 * Central SEO/AEO configuration and JSON-LD builders.
 * Set NEXT_PUBLIC_SITE_URL in the environment to your production domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://houseinmozambique.com').replace(/\/$/, '');
export const SITE_NAME = 'House in Mozambique';
export const SITE_TAGLINE = 'The Modern Estate Curator';
export const PRICE_CURRENCY = 'MZN';
export const TWITTER_HANDLE = '@houseinmoz';

export const DEFAULT_DESCRIPTION =
  'Discover premium real estate in Mozambique. Buy, rent, or book short stays in Maputo, Inhambane, Beira, Nampula and beyond — curated listings from verified local agents.';

export const DEFAULT_KEYWORDS = [
  'Mozambique real estate',
  'property for sale Mozambique',
  'rent house Mozambique',
  'Maputo apartments',
  'Inhambane villas',
  'Beira property',
  'short stay Mozambique',
  'real estate agents Mozambique',
  'buy house Maputo',
  'Bazaruto retreats',
];

/** Join a path onto the canonical site origin. */
export function absoluteUrl(path = '/'): string {
  if (!path) return SITE_URL;
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

interface PageMetaInput {
  title?: string;
  description?: string;
  path?: string;
  images?: string[];
  keywords?: string[];
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Build a complete, consistent Metadata object for a page.
 * Title is composed via the root layout's title template, so pass the bare page title.
 */
export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  images,
  keywords,
  type = 'website',
  noindex = false,
  publishedTime,
  modifiedTime,
}: PageMetaInput = {}): Metadata {
  const url = absoluteUrl(path);
  const ogImages = images && images.length > 0 ? images : [absoluteUrl('/opengraph-image')];

  return {
    title,
    description,
    keywords: keywords && keywords.length ? keywords : undefined,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    openGraph: {
      type: type === 'profile' ? 'profile' : type,
      url,
      siteName: SITE_NAME,
      title: title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`,
      description,
      images: ogImages.map((u) => ({ url: u, width: 1200, height: 630, alt: title || SITE_NAME })),
      locale: 'en_US',
      ...(type === 'article' ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`,
      description,
      images: ogImages,
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
  };
}

/* ----------------------------- JSON-LD builders ---------------------------- */

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: 'HouseinMozambique',
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    image: absoluteUrl('/opengraph-image'),
    description: DEFAULT_DESCRIPTION,
    areaServed: { '@type': 'Country', name: 'Mozambique' },
    knowsAbout: ['Real estate', 'Property sales', 'Property rentals', 'Short stays', 'Mozambique property market'],
    sameAs: [] as string[],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: ['en', 'pt'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/properties?location={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

interface ListingInput {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  city: string;
  neighborhood?: string | null;
  type: string;
  listingType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  host?: { name: string } | null;
}

export function realEstateListingJsonLd(p: ListingInput) {
  const url = absoluteUrl(`/properties/${p.id}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#listing`,
    name: p.title,
    description: p.description,
    image: p.images?.length ? p.images : [absoluteUrl('/opengraph-image')],
    category: `${p.type} for ${p.listingType}`,
    url,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      price: Math.round(p.price),
      priceCurrency: PRICE_CURRENCY,
      availability: 'https://schema.org/InStock',
      url,
      ...(p.host?.name ? { seller: { '@type': 'Organization', name: p.host.name } } : {}),
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Bedrooms', value: p.bedrooms },
      { '@type': 'PropertyValue', name: 'Bathrooms', value: p.bathrooms },
      { '@type': 'PropertyValue', name: 'Area', value: p.area, unitCode: 'MTK' },
      { '@type': 'PropertyValue', name: 'Listing type', value: p.listingType },
      { '@type': 'PropertyValue', name: 'City', value: p.city },
      ...(p.neighborhood ? [{ '@type': 'PropertyValue', name: 'Neighborhood', value: p.neighborhood }] : []),
    ],
  };
}

interface ArticleInput {
  title: string;
  excerpt: string;
  slug: string;
  coverImage?: string | null;
  publishedAt?: string | Date | null;
  updatedAt?: string | Date | null;
  author?: { name: string } | null;
  category?: string;
  tags?: string[];
}

export function articleJsonLd(a: ArticleInput) {
  const url = absoluteUrl(`/news/${a.slug}`);
  const published = a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined;
  const modified = a.updatedAt ? new Date(a.updatedAt).toISOString() : published;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: a.title,
    description: a.excerpt,
    image: a.coverImage ? [a.coverImage] : [absoluteUrl('/opengraph-image')],
    datePublished: published,
    dateModified: modified,
    articleSection: a.category,
    keywords: a.tags?.join(', '),
    inLanguage: 'en',
    author: { '@type': a.author?.name ? 'Person' : 'Organization', name: a.author?.name || SITE_NAME },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** Truthful, general FAQs used for AEO/answer-engine context on the home page. */
export const HOME_FAQS = [
  {
    question: 'How do I buy property in Mozambique?',
    answer:
      'Browse verified listings on House in Mozambique, contact the listing agent directly through the property page, and arrange viewings and due diligence. Each listing shows the agent, location, price, and full details so you can compare options across Maputo, Inhambane, Beira and other cities.',
  },
  {
    question: 'Can I rent or book a short stay through House in Mozambique?',
    answer:
      'Yes. Listings are categorised as Buy, Rent, and Short Stay. Use the filters to find monthly rentals or nightly short-stay accommodation, then contact the agent to confirm availability and terms.',
  },
  {
    question: 'Are the agents on House in Mozambique verified?',
    answer:
      'Listings are published by registered agents and reviewed by our team before going live. Verified agents display a badge, and every listing links to the agent profile with their contact details and portfolio.',
  },
  {
    question: 'Which areas of Mozambique are covered?',
    answer:
      'House in Mozambique features property across the country, including Maputo, Matola, Beira, Nampula, Tete, Inhambane and the Bazaruto archipelago, spanning apartments, villas, commercial space and coastal retreats.',
  },
  {
    question: 'How do I list my property as an agent?',
    answer:
      'Register an agent account, choose a plan on the Pricing page, and submit your listing with photos and details. Our team reviews each submission before it is published to maintain listing quality.',
  },
];
