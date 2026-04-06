import type { Metadata } from 'next';
import { DM_Sans, Montserrat } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import FooterWrapper from '@/components/layout/FooterWrapper';

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
  title: 'HouseinMozambique — The Modern Estate Curator',
  description:
    'Discover premium real estate in Mozambique. Buy, rent, or find short stays in Maputo, Inhambane, Beira, and more. Curated listings by expert local agents.',
  keywords: 'Mozambique real estate, property Maputo, rent villa Mozambique, buy house Mozambique',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${dmsans.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <FooterWrapper />
      </body>
    </html>
  );
}
