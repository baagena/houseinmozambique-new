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

/* ─────────────────────────────────── Ad card variants ─── */

function BannerAd({ ad, compact }: { ad: Ad; compact?: boolean }) {
  const bg = ad.bgColor || '#1a3c5e';
  const text = ad.textColor || '#ffffff';
  const accent = ad.accentColor || '#f4a61d';

  return (
    <div
      className={`w-full h-full overflow-hidden shadow-sm ${
        compact ? 'rounded-2xl border border-white/70 ring-1 ring-[#002045]/5' : 'rounded-2xl'
      }`}
      style={{ background: bg }}
    >
      <div className={`flex items-center justify-between h-full ${compact ? 'gap-4 px-4 py-3 md:px-5' : 'flex-col md:flex-row gap-6 px-8 py-7'}`}>
        {ad.imageUrl && (
          <div className={`${compact ? 'hidden lg:block w-12 h-12' : 'hidden md:block w-16 h-16'} rounded-xl overflow-hidden flex-shrink-0`}>
            <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-widest mb-1 opacity-65`} style={{ color: text }}>
            Sponsored
          </p>
          <p className={`font-extrabold leading-tight truncate ${compact ? 'text-sm md:text-base' : 'text-xl md:text-2xl'}`} style={{ color: text }}>
            {ad.title}
          </p>
          {ad.description && (
            <p className={`${compact ? 'hidden lg:block text-xs max-w-2xl truncate' : 'text-sm'} mt-1 opacity-75`} style={{ color: text }}>
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
  const accent = ad.accentColor || '#002045';
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
    <div className={`relative w-full ${canNavigate ? compact ? '' : 'px-10 md:px-12' : ''}`}>
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

      {/* Prev / Next arrows */}
      {/* {canNavigate && (
        <>
          <button
            onClick={() => goTo(current === 0 ? maxIndex : current - 1)}
            className={`${compact ? 'left-2 bg-white/90' : 'left-0 bg-white'} absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow flex items-center justify-center hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all text-[#002045] z-10 border border-[#e8e8e8]`}
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => goTo(current >= maxIndex ? 0 : current + 1)}
            className={`${compact ? 'right-2 bg-white/90' : 'right-0 bg-white'} absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow flex items-center justify-center hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all text-[#002045] z-10 border border-[#e8e8e8]`}
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )} */}
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
