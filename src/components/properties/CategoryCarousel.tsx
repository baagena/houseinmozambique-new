'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PropertyCard from './PropertyCard';
import { Property } from '@/types';

interface CategoryCarouselProps {
  title: string;
  properties: Property[];
  seeAllUrl: string;
  subtitle?: string;
  badge?: string;
}

export default function CategoryCarousel({
  title,
  properties,
  seeAllUrl,
  subtitle,
  badge,
}: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Houses to show: exactly 7 as requested
  const displayProperties = properties.slice(0, 7);
  // Get first 3 images for the 'See All' stacked card
  const stackImages = properties.slice(0, 3).map(p => p.images?.[0] || '');

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      // Minor delay to check scroll after animation
      setTimeout(checkScroll, 500);
    }
  };

  return (
    <section className="space-y-8">
      {/* ── Header ── */}
      <div className="flex justify-between items-end">
        <div>
          {badge && (
            <span className="text-[#845326] font-bold tracking-widest uppercase text-[10px] mb-2 block">
              {badge}
            </span>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-[#191c1e] flex items-center gap-3">
            {title}
            <Link href={seeAllUrl} className="inline-flex items-center justify-center p-1.5 rounded-full hover:bg-[#002045]/5 transition-colors group">
              <span className="material-symbols-outlined text-[24px] text-[#43474e] group-hover:text-[#002045] transition-colors leading-none">
                chevron_right
              </span>
            </Link>
          </h2>
          {subtitle && <p className="text-[#43474e] mt-2 text-sm md:text-base">{subtitle}</p>}
        </div>

        {/* Navigation Buttons (on top right as requested) */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-10 h-10 rounded-full border border-[#c4c6cf] flex items-center justify-center transition-all ${
              canScrollLeft ? 'text-[#002045] hover:bg-white hover:shadow-lg bg-white/50' : 'text-[#c4c6cf] cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <span className="material-symbols-outlined text-[20px] font-bold">chevron_left</span>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-10 h-10 rounded-full border border-[#c4c6cf] flex items-center justify-center transition-all ${
              canScrollRight ? 'text-[#002045] hover:bg-white hover:shadow-lg bg-white/50' : 'text-[#c4c6cf] cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <span className="material-symbols-outlined text-[20px] font-bold">chevron_right</span>
          </button>
        </div>
      </div>

      {/* ── Carousel Container ── */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-6 overflow-x-auto no-scrollbar pb-8 snap-x snap-mandatory scroll-px-4"
      >
        {displayProperties.map((p) => (
          <div key={p.id} className="flex-none w-[320px] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] snap-start">
            <PropertyCard property={p} />
          </div>
        ))}

        {/* ── 'See All' Stacked Card ── */}
        <div className="flex-none w-[320px] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] snap-start flex items-center justify-center">
          <Link
            href={seeAllUrl}
            className="group relative w-full h-full min-h-[400px] bg-white rounded-[2.5rem] border border-[#c4c6cf]/20 flex flex-col items-center justify-center gap-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
          >
            {/* Image Stack Effect */}
            <div className="relative w-40 h-40">
              {/* Back Image (rotated) */}
              <div className="absolute inset-0 bg-slate-100 rounded-3xl overflow-hidden shadow-sm rotate-[-12deg] translate-x-[-15%] transition-transform group-hover:rotate-[-20deg]">
                {stackImages[2] && <Image src={stackImages[2]} alt="" fill className="object-cover opacity-60" />}
              </div>
              {/* Middle Image (rotated) */}
              <div className="absolute inset-0 bg-slate-200 rounded-3xl overflow-hidden shadow-md rotate-[8deg] translate-x-[12%] transition-transform group-hover:rotate-[15deg]">
                {stackImages[1] && <Image src={stackImages[1]} alt="" fill className="object-cover opacity-80" />}
              </div>
              {/* Top Image */}
              <div className="absolute inset-0 bg-white rounded-3xl overflow-hidden shadow-xl z-10 transition-transform group-hover:scale-110">
                {stackImages[0] && <Image src={stackImages[0]} alt="" fill className="object-cover" />}
              </div>
            </div>

            <div className="text-center">
              <span className="block text-xl font-extrabold text-[#002045] tracking-tight mb-1">
                See all
              </span>
              <span className="text-xs font-bold text-[#845326] tracking-widest uppercase">
                {properties.length} Properties
              </span>
            </div>

            {/* Floating arrow button */}
            <div className="w-12 h-12 rounded-full bg-[#002045] text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95">
              <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
