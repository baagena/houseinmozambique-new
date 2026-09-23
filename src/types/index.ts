export interface Property {
  id: string;
  /** The headline in English. `titlePt` holds Portuguese; pick with listingHeadline(). */
  title: string;
  titlePt?: string | null;
  location: string;
  city: string;
  neighborhood?: string | null;
  price: number;
  priceUnit: 'sale' | 'monthly' | 'nightly';
  type: 'Villa' | 'Apartment' | 'Land' | 'Penthouse' | 'Studio' | 'Bungalow' | 'Lodge';
  listingType: 'Buy' | 'Rent' | 'Short Stay' | 'Auction';
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
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED';
  tags?: string[];

  /**
   * When this went live, and when it comes down.
   *
   * A portal's credibility rests on whether what you are looking at is still
   * for sale, and a date is the cheapest proof there is. Both are optional
   * because the older list queries do not select them, and a card that cannot
   * prove a listing is current should say nothing rather than guess.
   *
   * Dates cross the server/client boundary as ISO strings.
   */
  /** The readable address. Null only for rows not yet backfilled. */
  slug?: string | null;

  /** The wizard's category answers — floor, parking, DUAT status, use. The
      card's spec row reads these to avoid printing bedrooms on a shop. */
  details?: Record<string, unknown> | null;

  /** What it cost before the last change, so the card can show a reduction. */
  previousPrice?: number | null;
  priceChangedAt?: string | Date | null;

  /** Who is selling it, for the card's trust footer. */
  host?: {
    id?: string;
    name?: string;
    initials?: string;
    avatar?: string | null;
    isVerified?: boolean;
  } | null;
  createdAt?: string | Date | null;
  approvedAt?: string | Date | null;
  publishedUntil?: string | Date | null;
  /** Set on plan-backed listings from the subscription; see listing-lifecycle. */
  subscription?: { status: string; currentPeriodEnd: string | Date; graceUntil: string | Date | null } | null;
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
  listingType?: 'Buy' | 'Rent' | 'Short Stay' | 'Auction';
  location?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
}
