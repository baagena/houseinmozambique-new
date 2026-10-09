import type { Metadata } from 'next';
import './globals.css';
import { fontVariables } from './fonts';
import SiteChrome from '@/components/layout/SiteChrome';
import ChatWidget from '@/components/layout/ChatWidget';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import { getContentOverrides } from '@/lib/content';
import JsonLd from '@/components/seo/JsonLd';
import {
  SITE_NAME,
  SITE_TAGLINE,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  organizationJsonLd,
  websiteJsonLd,
} from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { requestLang } from '@/lib/request-lang';
import { EN_PREFIX } from '@/lib/site-lang';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await requestLang();
  return {
    /*
     * The English pages' base is the /en origin. Next joins a path-relative
     * canonical onto the base's path, so every page's `canonical: '/properties'`
     * (lib/seo.ts buildMetadata) comes out as /en/properties on the English
     * address without each page having to know its language.
     */
    metadataBase: new URL(lang === 'en' ? `${SITE_URL}${EN_PREFIX}` : SITE_URL),
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      // Absolute for English: '/' joined onto the /en base comes out as /en/.
      canonical: lang === 'en' ? `${SITE_URL}${EN_PREFIX}` : '/',
      languages: { pt: SITE_URL, en: `${SITE_URL}${EN_PREFIX}`, 'x-default': SITE_URL },
    },
    category: 'real estate',
    formatDetection: { telephone: true, address: true, email: true },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
      url: '/',
      locale: lang === 'en' ? 'en_US' : 'pt_MZ',
      alternateLocale: [lang === 'en' ? 'pt_MZ' : 'en_US'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
    },
    // Absolute: a relative path would be joined onto the /en base as well.
    icons: {
      icon: `${SITE_URL}/logo.png`,
      apple: `${SITE_URL}/logo.png`,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [contentOverrides, lang] = await Promise.all([getContentOverrides(), requestLang()]);

  return (
    /*
     * The language this renders: English on the /en addresses, Portuguese on
     * the rest (lib/site-lang.ts). Declaring English over Portuguese copy made
     * every assistive technology read it in an English voice. The provider
     * rewrites this attribute when a visitor picks the other language.
     */
    <html
      lang={lang}
      className={`antialiased ${fontVariables}`}
    >
      <body>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <LanguageProvider overrides={contentOverrides} initialLang={lang}>
          <SiteChrome>{children}</SiteChrome>
          {/* Inside the provider: the button writes its own opening message,
              which has to be in the language the visitor is reading. It sat
              outside while it was a third-party script that needed no copy. */}
          <ChatWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}