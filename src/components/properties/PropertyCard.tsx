'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Property } from '@/types';
import { formatPrice } from '@/lib/dummyData';

interface PropertyCardProps {
  property: Property;
  variant?: 'standard' | 'compact';
  hideLocation?: boolean;
}

export default function PropertyCard({ property, variant = 'standard', hideLocation = false }: PropertyCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  if (variant === 'compact') {
    return (
      <Link href={`/properties/${property.id}`} className="group flex gap-4 p-2 rounded-2xl hover:bg-white transition-all cursor-pointer">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        <div className="flex flex-col justify-center overflow-hidden">
          <h4 className="font-bold text-[#002045] text-sm truncate leading-tight mb-1 group-hover:text-[#845326] transition-colors">
            {property.title}
          </h4>
          {!hideLocation && (
            <p className="text-xs text-[#43474e] truncate mb-1">
              {property.location}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[#002045] text-sm">
              {formatPrice(property.price, property.priceUnit)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group relative flex flex-col h-full bg-white rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-[0_24px_48px_-12px_rgba(0,32,69,0.12)]">
      {/* ── Image Header ── */}
      <Link href={`/properties/${property.id}`} className="block relative aspect-[4/3] overflow-hidden">
        <Image
          src={property.images[0]}
          alt={property.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Professional warm gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#00152e]/60 via-[#002045]/10 to-transparent pointer-events-none z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#845326]/10 via-transparent to-[#002045]/20 pointer-events-none z-[1]" />

        {/* Badges Over Image */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 transition-transform duration-300 group-hover:translate-x-1">
          {property.isSuperhost && (
            <span className="bg-white/90 backdrop-blur-sm shadow-sm text-[#845326] px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-[#febc85]/30">
              Superhost
            </span>
          )}
          {property.isRareFind && (
            <span className="bg-[#ffdad3]/90 backdrop-blur-sm text-[#3e0500] px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm">
              Rare Find
            </span>
          )}
          {property.isNew && (
            <span className="bg-[#002045]/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm">
              New Listing
            </span>
          )}
          {property.isPremium && (
            <span className="bg-[#845326]/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm">
              Premium
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            setIsSaved(!isSaved);
          }}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 group/heart"
        >
          <span 
            className={`material-symbols-outlined text-[20px] transition-all duration-300 ${
              isSaved ? 'text-red-500 fill-1' : 'text-white group-hover/heart:text-red-500'
            }`}
            style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>
      </Link>

      {/* ── Content Body ── */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex justify-between items-start gap-4 mb-3">
          <Link href={`/properties/${property.id}`} className="hover:text-[#845326] transition-colors">
            <h3 className="text-xl font-bold text-[#002045] leading-tight" style={{ fontFamily: 'var(--font-headline)' }}>
              {property.title}
            </h3>
          </Link>
        </div>

        {!hideLocation && (
          <div className="flex items-center gap-1 text-[#43474e] text-sm mb-4">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            <span className="truncate">{property.location}</span>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-3 gap-2 py-4 border-y border-[#c4c6cf]/10 mb-5">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/50">
            <span className="material-symbols-outlined text-[18px] text-[#002045] mb-1">bed</span>
            <span className="text-[10px] uppercase font-bold text-[#43474e] tracking-tighter">{property.bedrooms} Beds</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/50">
            <span className="material-symbols-outlined text-[18px] text-[#002045] mb-1">bathtub</span>
            <span className="text-[10px] uppercase font-bold text-[#43474e] tracking-tighter">{property.bathrooms} Baths</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50/50">
            <span className="material-symbols-outlined text-[18px] text-[#002045] mb-1">square_foot</span>
            <span className="text-[10px] uppercase font-bold text-[#43474e] tracking-tighter">{property.area} m²</span>
          </div>
        </div>

        {/* Price & Footer */}
        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-[#845326] tracking-widest mb-0.5">Price</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-[#002045]">{formatPrice(property.price, property.priceUnit)}</span>
              {property.priceUnit === 'monthly' && <span className="text-xs text-[#43474e] font-medium">/ month</span>}
              {property.priceUnit === 'nightly' && <span className="text-xs text-[#43474e] font-medium">/ night</span>}
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase select-none ${
              property.listingType === 'Buy'
                ? 'bg-[#002045] text-white'
                : property.listingType === 'Rent'
                ? 'bg-[#845326]/15 text-[#845326] border border-[#845326]/30'
                : 'bg-[#0b4f6c]/10 text-[#0b4f6c] border border-[#0b4f6c]/25'
            }`}
          >
            {property.listingType}
          </span>
        </div>
      </div>
    </div>
  );
}