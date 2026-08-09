/**
 * The three services, each with its own page under /services.
 * `titleKey` / `taglineKey` are dot-paths inside the `services` translation block.
 */
export interface ServiceEntry {
  slug: string;
  index: number;
  icon: string;
  titleKey: 'advTitle' | 'shootTitle' | 'agentsTitle';
  taglineKey: 'advTagline' | 'shootTagline' | 'agentsTagline';
  image: string;
}

export const SERVICES: ServiceEntry[] = [
  {
    slug: 'property-advertising',
    index: 1,
    icon: 'campaign',
    titleKey: 'advTitle',
    taglineKey: 'advTagline',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1800',
  },
  {
    slug: 'property-assessment',
    index: 2,
    icon: 'photo_camera',
    titleKey: 'shootTitle',
    taglineKey: 'shootTagline',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1800',
  },
  {
    slug: 'agent-listing',
    index: 3,
    icon: 'real_estate_agent',
    titleKey: 'agentsTitle',
    taglineKey: 'agentsTagline',
    image:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1800',
  },
];

export const serviceHref = (slug: string) => `/services/${slug}`;

export const getService = (slug: string) =>
  SERVICES.find((service) => service.slug === slug) as ServiceEntry;
