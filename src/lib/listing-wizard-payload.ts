import { featuresInScope, type GeneratedListing, type ListingAnswers } from '@/lib/listing-copy';

/** Per-listing contact buttons collected on the wizard's last step. */
export interface ListingContact {
  whatsapp: string;
  phone: string;
  email: string;
}

/**
 * The Property fields a guided-wizard submission becomes.
 *
 * Shared by the web wizard and the mobile API, so a listing written from the
 * app is stored exactly like one written on the website: same generated title
 * pair, same bilingual body, same search copy, same category details.
 */
export function wizardPropertyFields(answers: ListingAnswers, g: GeneratedListing, contact: ListingContact) {
  return {
    title: g.title,
    titlePt: g.titlePt,
    description: g.ptDesc,
    descriptionEn: g.enDesc,
    metaEn: g.meta,
    metaPt: g.metaPt,
    city: answers.city,
    neighborhood: answers.bairro,
    latitude: answers.lat,
    longitude: answers.lng,
    address: answers.bairro,
    price: answers.price,
    priceUnit:
      answers.listingType === 'sale' ? 'sale' : answers.listingType === 'rent' ? 'monthly' : 'nightly',
    propertyType: answers.propertyType,
    listingType:
      answers.listingType === 'sale' ? 'Buy' : answers.listingType === 'rent' ? 'Rent' : 'Short Stay',
    bedrooms: answers.beds,
    bathrooms: answers.baths,
    area: answers.buildingSize || answers.landSize,
    /*
     * Furnishing left the chip list and became a three-way question, but
     * "Furnished" is still the amenity every furnishing filter matches on — so
     * it is derived back here rather than lost. Chips belonging to another
     * category are dropped at the same time, in case the agent ticked some and
     * then changed the property type.
     */
    amenities: [
      ...featuresInScope(answers),
      ...(answers.furnishing === 'full' ? ['Furnished']
        : answers.furnishing === 'semi' ? ['Semi-furnished']
        : []),
    ],
    /* The category answers, kept so the listing can be edited later without
     * the agent re-answering every question. */
    details: {
      condition: answers.condition, furnishing: answers.furnishing,
      suites: answers.suites, storeys: answers.storeys, floor: answers.floor,
      parking: answers.parking,
      frontage: answers.frontage, depth: answers.depth,
      zoning: answers.zoning, duat: answers.duat,
      roadSurface: answers.roadSurface, structures: answers.structures,
      commercialUse: answers.commercialUse,
    },
    tags: [] as string[],
    contactWhatsapp: contact.whatsapp.trim() || null,
    contactPhone: contact.phone.trim() || null,
    contactEmail: contact.email.trim() || null,
  };
}
