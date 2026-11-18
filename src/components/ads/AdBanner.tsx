'use client';

import { useEffect, useRef, useState } from 'react';

interface Ad {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  position: string;
  type: string;
  bgColor?: string | null;
  textColor?: string | null;
  accentColor?: string | null;
}

interface AdBannerProps {
  ads: Ad[];
  position: string;
  /** override the auto-layout; useful for sidebar etc. */
  forceLayout?: 'single' | 'row' | 'carousel';
  compact?: boolean;
}

function trackClick(id: string) {
  fetch(`/api/admin/ads/${id}/click`, { method: 'POST' }).catch(() => {});
}

/** A link to a video file (MP4/WebM/MOV, or a Cloudinary video upload). */
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  let path = url.toLowerCase();
  try { path = new URL(url, 'https://x').pathname.toLowerCase(); } catch { /* keep raw */ }
  return /\.(mp4|webm|mov|m4v)$/.test(path) || path.includes('/video/upload/');
}

/** Black or white text, whichever reads better on a hex background. */
function onColor(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return '#ffffff';
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#111827' : '#ffffff';
}

/** A banner must be at least 3:2 wide and 600 px across (same rule as the app). */
export const BANNER_MIN_RATIO = 1.5;
export const BANNER_MIN_WIDTH = 600;
export function isBannerSize(width: number, height: number): boolean {
  return width > 0 && height > 0 && width / height >= BANNER_MIN_RATIO && width >= BANNER_MIN_WIDTH;
}

/*
 * An ad with artwork. A wide, large picture (or a video) is shown whole at
 * full width with the title and button below; anything else — logos, square
 * or small pictures, small GIFs — is a small tile beside the title, never
 * stretched. The real size is read when the picture loads.
 */
function MediaAd({ ad }: { ad: Ad }) {
  const brand = ad.bgColor || '#13233F';
  const video = isVideoUrl(ad.imageUrl);
  const [muted, setMuted] = useState(true);
  const [broken, setBroken] = useState(false);
  const [banner, setBanner] = useState(false);
  const [ratio, setRatio] = useState(3);

  const measure = (img: HTMLImageElement) => {
    if (isBannerSize(img.naturalWidth, img.naturalHeight)) {
      setRatio(Math.min(4, img.naturalWidth / img.naturalHeight));
      setBanner(true);
    }
  };

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-[#e6e8eb] bg-white shadow-sm">
      {video && !broken && (
        <div className="relative flex items-center justify-center bg-black" style={{ aspectRatio: '16 / 9' }}>
          <video
            src={ad.imageUrl ?? undefined}
            autoPlay
            muted={muted}
            loop
            playsInline
            preload="metadata"
            onError={() => setBroken(true)}
            className="block h-full w-full object-contain"
          />
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Turn sound on' : 'Mute'}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white"
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      )}
      {!video && !broken && banner && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.imageUrl ?? undefined} alt={ad.title} className="block w-full object-cover" style={{ aspectRatio: String(ratio) }} />
      )}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {!video && !broken && !banner && (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-[#e6e8eb] bg-white p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.imageUrl ?? undefined}
                alt=""
                onLoad={(e) => measure(e.currentTarget)}
                onError={() => setBroken(true)}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          <div className="min-w-0">
            <span className="mb-1 inline-block rounded-md border border-[#e6e8eb] bg-[#f6f7f9] px-2 py-0.5 text-[10.5px] font-semibold text-[#5b616b]">
              Sponsored
            </span>
            <p className="font-semibold leading-snug text-[#111827]">{ad.title}</p>
            {ad.description && <p className="mt-0.5 line-clamp-2 text-sm text-[#5b616b]">{ad.description}</p>}
          </div>
        </div>
        {ad.linkUrl && (
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(ad.id)}
            className="flex-shrink-0 rounded-xl px-5 py-2.5 text-center text-sm font-bold transition hover:opacity-90"
            style={{ background: brand, color: onColor(brand) }}
          >
            {(ad.linkText || 'Learn more').replace(/\s*[→>]+\s*$/, '')} →
          </a>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Ad card variants ─── */

function BannerAd({ ad, compact }: { ad: Ad; compact?: boolean }) {
  const bg = ad.bgColor || '#13233F';
  const text = ad.textColor || '#ffffff';
  const accent = ad.accentColor || '#C4922F';

  return (
    <div
      className={`relative w-full h-full overflow-hidden shadow-sm ${
        compact ? 'rounded-2xl border border-white/70 ring-1 ring-[#13233F]/5' : 'rounded-2xl'
      }`}
      style={{ background: bg }}
    >
      {/* Subtle sheen so a solid-color ad still reads as a designed card, not a flat bar */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 15% -20%, rgba(255,255,255,0.16), transparent 55%)' }}
      />
      <div className={`relative flex items-center justify-between h-full ${compact ? 'gap-4 px-5 py-4 sm:px-6' : 'flex-col md:flex-row gap-6 px-8 py-7'}`}>
        {ad.imageUrl && (
          <div className={`${compact ? 'hidden sm:block w-11 h-11 lg:w-14 lg:h-14' : 'hidden md:block w-16 h-16'} rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/20`}>
            <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span
            className={`inline-block ${compact ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'} font-bold uppercase tracking-widest mb-1.5 rounded-full`}
            style={{ color: text, background: 'rgba(255,255,255,0.14)' }}
          >
            Sponsored
          </span>
          <p className={`font-semibold leading-tight truncate ${compact ? 'text-sm sm:text-base' : 'text-xl md:text-2xl'}`} style={{ color: text }}>
            {ad.title}
          </p>
          {ad.description && (
            <p className={`${compact ? 'hidden sm:block text-xs max-w-2xl truncate' : 'text-sm'} mt-1 opacity-75`} style={{ color: text }}>
              {ad.description}
            </p>
          )}
        </div>
        {ad.linkUrl && (
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(ad.id)}
            className={`${compact ? 'px-3 py-2 text-[11px] md:px-4' : 'px-5 py-2.5 text-sm'} flex-shrink-0 rounded-xl font-bold transition-all hover:opacity-90 hover:scale-105 active:scale-95`}
            style={{ background: accent, color: '#1a1a1a' }}
          >
            {ad.linkText || 'Learn More →'}
          </a>
        )}
      </div>
    </div>
  );
}

function CardRowAd({ ad }: { ad: Ad }) {
  const accent = ad.accentColor || '#13233F';
  return (
    <div className="border border-[#e8e8e8] rounded-2xl p-5 bg-white flex flex-col sm:flex-row items-start sm:items-center gap-4 h-full hover:shadow-md transition-shadow">
      {ad.imageUrl && (
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
          <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#aaa] mb-0.5">Sponsored</p>
        <p className="text-sm font-bold text-[#111]">{ad.title}</p>
        {ad.description && <p className="text-xs text-[#888] mt-0.5">{ad.description}</p>}
      </div>
      {ad.linkUrl && (
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick(ad.id)}
          className="text-xs font-semibold hover:underline flex-shrink-0 transition-colors"
          style={{ color: accent }}
        >
          {ad.linkText || 'Learn more →'}
        </a>
      )}
    </div>
  );
}

function StripAd({ ad }: { ad: Ad }) {
  const accent = ad.accentColor || '#7c3aed';
  return (
    <div className="border border-[#e6e6e6] rounded-2xl px-6 py-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-full hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {ad.imageUrl && (
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
            <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#bbb] mb-0.5">Sponsored</p>
          <p className="text-sm font-bold text-[#111]">{ad.title}</p>
          {ad.description && <p className="text-xs text-[#888]">{ad.description}</p>}
        </div>
      </div>
      {ad.linkUrl && (
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick(ad.id)}
          className="text-white text-xs font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          style={{ background: accent }}
        >
          {ad.linkText || 'Learn more →'}
        </a>
      )}
    </div>
  );
}

/* ─────────────────────────────────── Render one ad ─── */
function AdCard({ ad, compact }: { ad: Ad; compact?: boolean }) {
  // Artwork always gets the full-media layout (whole picture, or a playing video).
  if (ad.imageUrl) return <MediaAd ad={ad} />;
  if (ad.type === 'card_row') return <CardRowAd ad={ad} />;
  if (ad.type === 'strip') return <StripAd ad={ad} />;
  return <BannerAd ad={ad} compact={compact} />;
}

/* ─────────────────────────────────── Carousel ─── */
function AdCarousel({ ads, compact }: { ads: Ad[]; compact?: boolean }) {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = compact || isMobile ? ads.length - 1 : Math.max(0, ads.length - 2);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c >= maxIndex ? 0 : c + 1));
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ads.length, maxIndex]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    startTimer();
  };

  const showArrows = ads.length > (isMobile ? 1 : 2);
  const canNavigate = compact ? ads.length > 1 : showArrows;

  return (
    <div className={`relative w-full ${canNavigate ? 'px-9 md:px-12' : ''}`}>
      {/* Slide track */}
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex -mx-2 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * (compact || isMobile ? 100 : 50)}%)` }}
        >
          {ads.map((ad) => (
            <div key={ad.id} className={`w-full ${compact ? '' : 'md:w-1/2'} flex-shrink-0 px-2`}>
              <AdCard ad={ad} compact={compact ?? true} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots — so a rotating slot never reads as "just one plain ad" */}
      {ads.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {ads.map((ad, i) => (
            <button
              key={ad.id}
              onClick={() => goTo(i)}
              aria-label={`Show sponsored slide ${i + 1} of ${ads.length}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-[#13233F]' : 'w-1.5 bg-[#13233F]/20 hover:bg-[#13233F]/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Prev / Next arrows */}
      {canNavigate && (
        <>
          <button
            onClick={() => goTo(current === 0 ? maxIndex : current - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full shadow-md bg-white flex items-center justify-center hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all text-[#13233F] z-10 border border-[#e8e8e8]"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => goTo(current >= maxIndex ? 0 : current + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full shadow-md bg-white flex items-center justify-center hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all text-[#13233F] z-10 border border-[#e8e8e8]"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────── Main export ─── */
export default function AdBanner({ ads, position, forceLayout, compact }: AdBannerProps) {
  const positionAds = ads.filter((a) => a.position === position);
  if (positionAds.length === 0) return null;

  const count = positionAds.length;
  const layout = forceLayout ?? (count >= 3 ? 'carousel' : count === 2 ? 'row' : 'single');

  return (
    <div>
      {layout === 'single' && (
        <AdCard ad={positionAds[0]} compact={compact} />
      )}

      {layout === 'row' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {positionAds.map((ad) => (
            <AdCard key={ad.id} ad={ad} compact={compact ?? true} />
          ))}
        </div>
      )}

      {layout === 'carousel' && (
        <AdCarousel ads={positionAds} compact={compact} />
      )}
    </div>
  );
}
