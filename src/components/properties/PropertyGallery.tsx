'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface PropertyGalleryProps {
  images: string[];
  title: string;
  isSuperhost?: boolean;
  isRareFind?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
}

export default function PropertyGallery({
  images,
  title,
  isSuperhost,
  isRareFind,
  isNew,
  isPremium,
}: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const thumbnailImages = images.slice(0, 4);
  const extraCount = images.length - 4;

  // Open lightbox at a specific index
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Keyboard navigation in lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === 'Escape') setLightboxOpen(false);
    },
    [lightboxOpen, images.length]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  return (
    <>
      {/* ── Gallery Grid ── */}
      <section className="grid grid-cols-1 md:grid-cols-4 grid-rows-none md:grid-rows-2 gap-3 h-auto md:h-[500px] mb-12 overflow-hidden rounded-xl">
        {/* Main Large Image */}
        <div
          className="col-span-1 md:col-span-2 row-span-1 md:row-span-2 relative aspect-[4/3] md:aspect-auto overflow-hidden group cursor-pointer"
          onClick={() => openLightbox(activeIndex)}
        >
          <Image
            src={images[activeIndex]}
            alt={title}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
            {isSuperhost && (
              <span className="bg-white/90 backdrop-blur-sm shadow-sm text-[#845326] px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border border-[#febc85]/30">
                ★ Superhost
              </span>
            )}
            {isRareFind && (
              <span className="bg-[#ffdad3]/90 backdrop-blur-sm text-[#3e0500] px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm">
                Rare Find
              </span>
            )}
            {isNew && (
              <span className="bg-[#002045]/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm">
                New Listing
              </span>
            )}
            {isPremium && (
              <span className="bg-[#845326]/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm">
                Premium
              </span>
            )}
          </div>

          {/* Image counter */}
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 pointer-events-none">
            {activeIndex + 1} / {images.length}
          </div>

          {/* Expand hint on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-black/40 backdrop-blur-sm text-white rounded-full px-4 py-2 text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">fullscreen</span>
              View fullscreen
            </div>
          </div>
        </div>

        {/* 4 Thumbnails */}
        {thumbnailImages.map((img, i) => {
          const isLast = i === thumbnailImages.length - 1;
          const showMore = isLast && extraCount > 0;

          return (
            <div
              key={i}
              className={`relative overflow-hidden group cursor-pointer transition-all duration-300 ${
                activeIndex === i && !showMore
                  ? 'ring-2 ring-[#845326] ring-offset-2'
                  : 'opacity-75 hover:opacity-100'
              }`}
              onClick={() => {
                if (showMore) {
                  openLightbox(4); // open at first "extra" image
                } else {
                  setActiveIndex(i);
                }
              }}
            >
              <Image
                src={img}
                alt={`${title} — photo ${i + 1}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Active indicator */}
              {activeIndex === i && !showMore && (
                <div className="absolute inset-0 bg-[#845326]/10 flex items-end justify-end p-2 pointer-events-none">
                  <div className="bg-[#845326] text-white rounded-full p-0.5">
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check
                    </span>
                  </div>
                </div>
              )}

              {/* +N more overlay */}
              {showMore && (
                <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-white text-4xl">grid_view</span>
                  <span className="text-white font-extrabold text-sm tracking-wide">
                    +{extraCount} photos
                  </span>
                  <span className="text-white/70 text-[10px] font-medium">Click to view all</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty placeholders */}
        {images.length < 4 &&
          Array.from({ length: 4 - images.length }).map((_, idx) => (
            <div key={`placeholder-${idx}`} className="hidden md:block bg-[#eceef0] rounded-lg" />
          ))}
      </section>

      {/* ── Fullscreen Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-white font-bold text-sm truncate max-w-[60vw]">{title}</p>
              <p className="text-white/50 text-xs mt-0.5">{lightboxIndex + 1} of {images.length} photos</p>
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center flex-shrink-0"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-white text-xl">close</span>
            </button>
          </div>

          {/* Main Lightbox Image */}
          <div
            className="flex-1 relative flex items-center justify-center px-16 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-h-[75vh]">
              <Image
                src={images[lightboxIndex]}
                alt={`${title} — photo ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Prev */}
            <button
              onClick={() => setLightboxIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105"
              aria-label="Previous"
            >
              <span className="material-symbols-outlined text-white text-2xl">chevron_left</span>
            </button>

            {/* Next */}
            <button
              onClick={() => setLightboxIndex((i) => (i + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105"
              aria-label="Next"
            >
              <span className="material-symbols-outlined text-white text-2xl">chevron_right</span>
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div
            className="flex gap-2 px-6 py-4 overflow-x-auto flex-shrink-0 justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all duration-200 ${
                  i === lightboxIndex
                    ? 'ring-2 ring-[#845326] ring-offset-1 ring-offset-black opacity-100 scale-105'
                    : 'opacity-50 hover:opacity-80'
                }`}
              >
                <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
