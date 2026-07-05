import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE, DEFAULT_DESCRIPTION } from '@/lib/seo';

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #002045 0%, #0a2f5c 100%)',
          padding: '72px',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 9999,
              background: '#fab983',
            }}
          />
          <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: 1, color: '#fab983' }}>
            {SITE_TAGLINE.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            {SITE_NAME}
          </span>
          <span style={{ fontSize: 30, color: '#9fb4d6', maxWidth: 880, lineHeight: 1.35 }}>
            {DEFAULT_DESCRIPTION}
          </span>
        </div>

        <span style={{ fontSize: 24, color: '#9fb4d6' }}>houseinmozambique.com</span>
      </div>
    ),
    { ...size },
  );
}
