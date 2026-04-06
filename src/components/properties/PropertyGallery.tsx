'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [activeImage, setActiveImage] = useState(images[0]);

  return (
    <section className="grid grid-cols-1 md:grid-cols-4 grid-rows-none md:grid-rows-2 gap-3 h-auto md:h-[500px] mb-12 overflow-hidden rounded-xl">
      {/* Main Large Image */}
      <div className="col-span-1 md:col-span-2 row-span-1 md:row-span-2 relative aspect-[4/3] md:aspect-auto overflow-hidden group">
        <Image
          src={activeImage}
          alt={title}
          fill
          className="object-cover transition-all duration-700 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Thumbnails */}
      {images.slice(0, 5).map((img, i) => {
        // Skip rendering the first image in the small grid if you want, 
        // but often it's better to show all thumbnails or a specific set.
        // The original design had images[0] as main, and slice(1, 5) as small.
        // Let's stick to that but allow clicking ANY to become main.
        
        // Wait, if I use slice(1, 5), then index 0 is always main unless clicked?
        // Let's just show the first 5 images total. The first one is main by default.
        // If I want the original layout:
        if (i === 0) return null; 

        return (
          <div 
            key={i} 
            className={`relative overflow-hidden group cursor-pointer transition-all duration-300 ${
              activeImage === img ? 'ring-2 ring-[#845326] ring-offset-2' : 'opacity-80 hover:opacity-100'
            }`}
            onClick={() => setActiveImage(img)}
          >
            <Image
              src={img}
              alt={`${title} photo ${i + 1}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {i === 4 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-white font-bold text-xs">View Image</span>
              </div>
            )}
            {/* Show all photos overlay on the last Thumbnail if it's the 4th small one (index 4 total) */}
            {i === 4 && (
              <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[#002045] font-bold text-[10px] flex items-center gap-1.5 shadow-lg z-10">
                <span className="material-symbols-outlined text-sm">grid_view</span>
                All Photos
              </button>
            )}
          </div>
        );
      })}
      
      {/* If there are fewer than 5 images, handle layout gracefully */}
      {images.length < 5 && Array.from({ length: 5 - images.length }).map((_, idx) => (
        <div key={`placeholder-${idx}`} className="hidden md:block bg-[#eceef0] animate-pulse rounded-lg" />
      ))}
    </section>
  );
}
