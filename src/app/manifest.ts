import type { MetadataRoute } from 'next';
import { SITE_NAME, SITE_TAGLINE, DEFAULT_DESCRIPTION } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f9fb',
    theme_color: '#002045',
    categories: ['business', 'lifestyle', 'shopping'],
    lang: 'en',
    icons: [
      { src: '/logo.png', sizes: 'any', type: 'image/png' },
    ],
  };
}
