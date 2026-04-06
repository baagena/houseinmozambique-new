'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  
  // Define paths where the footer should be hidden (focused form experience)
  const hideFooterPaths = ['/post-property', '/auth'];
  const shouldHide = hideFooterPaths.some(path => pathname?.startsWith(path));

  if (shouldHide) return null;

  return <Footer />;
}
