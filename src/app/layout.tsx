import type { Metadata } from 'next';
import { DM_Sans, Montserrat } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import FooterWrapper from '@/components/layout/FooterWrapper';
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
import Script from 'next/script';

const dmsans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dmsans',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

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
    <html lang="en" className={`${montserrat.variable} ${dmsans.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <LanguageProvider overrides={contentOverrides}>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <FooterWrapper />
        </LanguageProvider>
        <Script
          src="//code.tidio.co/dskhwbtaf4xshe1pluqs7ilizketnylv.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}