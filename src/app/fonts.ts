/**
 * Typefaces, self-hosted.
 *
 * These were previously pulled from fonts.googleapis.com with a render-blocking
 * <link> — one in the root layout, another inside the dashboard layout. On a
 * slow connection that is a third-party DNS lookup, TLS handshake and round
 * trip before any text can paint, and the console shifted when the faces
 * finally landed.
 *
 * next/font downloads them at BUILD time and serves them from this origin, so
 * there is no third-party request and no layout shift. `display: 'swap'` keeps
 * text readable while the face loads, and the fallback stacks below are chosen
 * for close metrics so the swap is barely visible.
 */
import { Fraunces, Public_Sans, IBM_Plex_Mono } from 'next/font/google';

/** Headings and figures in the console. */
export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal'],
  display: 'swap',
  variable: '--font-fraunces',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

/** Interface text. */
export const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-public-sans',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

/** Every figure. Tabular numerals keep columns of numbers from jittering. */
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-plex-mono',
  fallback: ['SFMono-Regular', 'Consolas', 'Liberation Mono', 'monospace'],
});

/** Applied once, on <html>, so the variables are in scope everywhere. */
export const fontVariables = `${fraunces.variable} ${publicSans.variable} ${plexMono.variable}`;
