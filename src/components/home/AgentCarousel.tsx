'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import AgentCard from '@/components/agents/AgentCard';

interface AgentCarouselProps {
  agents: any[];
  title?: string;
  subtitle?: string;
}

export default function AgentCarousel({
  agents,
  title = "Our Featured Agents",
  subtitle = "Work with Mozambique's most experienced and trusted real estate professionals"
}: AgentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
  }, [agents]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth, scrollLeft, scrollWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      
      // Infinite-like loop logic for auto-scroll
      if (direction === 'right' && scrollLeft >= scrollWidth - clientWidth - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (direction === 'left' && scrollLeft <= 10) {
        scrollRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
      
      setTimeout(checkScroll, 500);
    }
  };

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      scroll('right');
    }, 5000); // 5 seconds interval
    
    return () => clearInterval(interval);
  }, [agents]);

  return (
    <section className="space-y-12 py-16">
      {/* ── Header ── */}
      <div className="flex justify-between items-end px-4 md:px-0">
        {/* <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-black text-[#002045] tracking-tight mb-4" style={{ fontFamily: 'var(--font-headline)' }}>
            {title}
          </h2>
          {subtitle && <p className="text-[#43474e] text-lg font-medium opacity-70">{subtitle}</p>}
        </div> */}

        {/* Navigation Buttons */}
        <div className="hidden md:flex items-center gap-4 ml-auto">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-14 h-14 rounded-2xl border-2 border-[#002045]/10 flex items-center justify-center transition-all duration-300 ${
              canScrollLeft 
                ? 'text-[#002045] hover:bg-[#002045] hover:text-white hover:shadow-2xl shadow-[#002045]/20' 
                : 'text-[#c4c6cf] cursor-not-allowed opacity-50'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-14 h-14 rounded-2xl border-2 border-[#002045]/10 flex items-center justify-center transition-all duration-300 ${
              canScrollRight 
                ? 'text-[#002045] hover:bg-[#002045] hover:text-white hover:shadow-2xl shadow-[#002045]/20' 
                : 'text-[#c4c6cf] cursor-not-allowed opacity-50'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* ── Carousel Container ── */}
      <div className="relative group/carousel">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-8 overflow-x-auto no-scrollbar pb-12 snap-x snap-mandatory scroll-px-0"
        >
          {agents.map((agent) => (
            <div key={agent.id} className="flex-none w-[360px] md:w-[600px] snap-start">
              <AgentCard agent={agent} />
            </div>
          ))}

        </div>

        {/* Gradient shadows for hint of more content */}
        {!canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-12 w-24 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        )}
        {!canScrollRight && (
            <div className="absolute right-0 top-0 bottom-12 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        )}
      </div>

      <div className="flex justify-center mt-12">
        <Link 
          href="/agents" 
          className="group flex items-center gap-4 bg-[#002045] text-white px-10 py-5 rounded-[2rem] font-black text-lg transition-all duration-300 hover:bg-[#003066] hover:shadow-[0_20px_40px_rgba(0,32,69,0.3)] hover:-translate-y-1"
        >
          <span>View All Agents</span>
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:text-[#002045]">
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
