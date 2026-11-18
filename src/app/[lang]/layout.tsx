
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { fontVariables } from '../fonts';
import SiteChrome from '@/components/layout/SiteChrome';
import ChatWidget from '@/components/layout/ChatWidget';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import { getContentOverrides, type ContentOverrides } from '@/lib/content';
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
import { EN_PREFIX, SITE_LANGS, toSiteLang } from '@/lib/site-lang';
import SiteAnalytics from '@/components/analytics/SiteAnalytics';

/*
 * Every public page is cached and rebuilt in the background (ISR) instead of
 * rendered for each visit — rendering on every request was most of this
 * site's Vercel CPU bill.
 *
 * The language used to come from a request header the proxy set, and reading
 * a header makes every page below it render per request. It is now the
 * [lang] segment: src/proxy.ts rewrites `/x` to `/pt/x` and serves `/en/x` as
 * `/en/x`, so the addresses visitors and search engines see do not change.
 *
 * Edits reach the cache straight away: src/lib/db.ts purges the public pages
 * after any write to data they show. `revalidate` is only the backstop, for
 * changes no write announces (a plan or a featured pick running out).
 */
const OG_IMAGE = `${SITE_URL}/opengraph-image`;

export const revalidate = 3600;

/*
 * Nothing is built ahead of time: each page is rendered on its first visit
 * after a deploy and cached from then on (an empty list is what turns that
 * on). Building them in `next build` made every deploy depend on the database
 * answering, which it never had to before.
 */
export function generateStaticParams() {
  return [];
}

type LayoutProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const lang = toSiteLang((await params).lang);
  return {
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
      /* Named outright: src/app/opengraph-image.tsx sits above this layout, so
         the file convention no longer attaches it to the pages by itself. */
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
      images: [OG_IMAGE],
    },
    icons: {
      icon: `${SITE_URL}/logo.png`,
      apple: `${SITE_URL}/logo.png`,
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps & {
  children: React.ReactNode;
}) {
  const param = (await params).lang;
  // Only the proxy chooses this segment, and only as pt or en.
  if (!(SITE_LANGS as readonly string[]).includes(param)) notFound();
  const lang = toSiteLang(param);
  /*
   * The frame of the site (menu, footer, and every page that is only text)
   * must not depend on the database answering. If staff's edited copy cannot
   * be read, the copy built into the code is used instead.
   *
   * A page first rendered that way is cached like any other, so it can show
   * the built-in copy for up to the hour above, or until the next edit purges
   * it. Purging it here instead would also throw away the good cached pages
   * that are carrying the site through the outage.
   */
  let contentOverrides: ContentOverrides = { en: {}, pt: {} };
  try {
    contentOverrides = await getContentOverrides();
  } catch (err) {
    console.error('layout: site content unavailable, using built-in copy', err);
  }

  return (
    <html lang={lang} className={`antialiased ${fontVariables}`}>
      <body>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />

        <LanguageProvider overrides={contentOverrides} initialLang={lang}>
          <SiteChrome>{children}</SiteChrome>
          <ChatWidget />
        </LanguageProvider>

        {process.env.NEXT_PUBLIC_GA_ID && (
          <SiteAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
