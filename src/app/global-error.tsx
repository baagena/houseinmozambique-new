'use client';

import { useEffect } from 'react';

/*
 * The last resort: shown only when the layout itself fails, so there is no
 * menu or footer to keep. It replaces Next's black "This page couldn't load"
 * screen. It renders its own document and gets none of the site's styles or
 * translations, which is why everything here is inline and in both languages.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f7f7f5',
          color: '#13233F',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          padding: 24,
        }}
      >
        <title>House in Mozambique</title>
        <main style={{ maxWidth: 520, textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="House in Mozambique" width={72} height={72} style={{ objectFit: 'contain' }} />
          <h1 style={{ fontSize: 26, lineHeight: 1.25, margin: '20px 0 12px' }}>
            Voltamos já
            <span style={{ display: 'block', fontSize: 18, fontWeight: 500, color: '#5E6B7A', marginTop: 6 }}>
              We&apos;ll be right back
            </span>
          </h1>
          <p style={{ color: '#5E6B7A', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
            O site está temporariamente indisponível. Tente novamente dentro de instantes.
            <br />
            The site is temporarily unavailable. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 28,
              padding: '12px 26px',
              borderRadius: 999,
              border: 0,
              background: '#13233F',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar novamente · Try again
          </button>
        </main>
      </body>
    </html>
  );
}
