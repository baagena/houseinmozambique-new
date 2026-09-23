import type { Metadata } from 'next';
import './globals.css';
import { fontVariables } from './fonts';
import SiteChrome from '@/components/layout/SiteChrome';
import ChatWidget from '@/components/layout/ChatWidget';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import { getContentOverrides } from '@/lib/content';
import JsonLd from '@/components/seo/JsonLd';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  organizationJsonLd,
  websiteJsonLd,
} from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  alternates: { canonical: '/' },
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
    url: SITE_URL,
    locale: 'en_US',
    alternateLocale: ['pt_PT'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contentOverrides = await getContentOverrides();

  return (
    /*
     * Portuguese, because that is what this renders.
     *
     * LanguageProvider opens on 'pt' and only switches after it has read
     * localStorage on the client, so the server HTML — the copy Google indexes
     * and the one a screen reader meets first — is always Portuguese. Declaring
     * it as English made every assistive technology read a Portuguese page in
     * an English voice. The provider rewrites this attribute when a visitor
     * picks the other language.
     */
    <html
      lang="pt"
      className={`antialiased ${fontVariables}`}
    >
      <body>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <LanguageProvider overrides={contentOverrides}>
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