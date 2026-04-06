export interface Property {
  id: string;
  title: string;
  location: string;
  city: string;
  price: number;
  priceUnit: 'sale' | 'monthly' | 'nightly';
  type: 'Villa' | 'Apartment' | 'Land' | 'Penthouse' | 'Studio' | 'Bungalow' | 'Lodge';
  listingType: 'Buy' | 'Rent' | 'Short Stay';
  bedrooms: number;
  bathrooms: number;
  area: number; // m²
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isPremium?: boolean;
  isNew?: boolean;
  isGuestFavorite?: boolean;
  isSuperhost?: boolean;
  isRareFind?: boolean;
  badge?: string;
  images: string[];
  description: string;
  amenities: string[];
  houseRules?: string[];
  hostId: string;
  tags?: string[];
}

export interface Agent {
  id: string;
  name: string;
  initials: string;
  title: string;
  location: string;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isVerified?: boolean;
  avatar?: string;
  bio?: string;
  yearsExperience?: number;
  specializations?: string[];
}

export interface SearchFilters {
  listingType?: 'Buy' | 'Rent' | 'Short Stay';
  location?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
}
