import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const disallow = ['/dashboard/', '/api/', '/auth'];

  return {
    rules: [
      {
        // All crawlers, including search engines.
        userAgent: '*',
        allow: '/',
        disallow,
      },
      {
        // AI / answer-engine crawlers — explicitly welcomed for AEO.
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'Perplexity-User',
          'ClaudeBot',
          'Claude-Web',
          'Claude-User',
          'Google-Extended',
          'Applebot',
          'Applebot-Extended',
          'Amazonbot',
          'Bingbot',
          'DuckAssistBot',
          'CCBot',
        ],
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
