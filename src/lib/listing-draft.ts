/**
 * Drafting a listing from whatever the agent already wrote.
 *
 * An agent has the property in their head, or in a WhatsApp message they sent
 * someone. Making them re-key that into eighteen form fields is the reason
 * listings go up thin. So: they write one paragraph in Portuguese or English,
 * and this turns it into a draft they correct — never a listing it publishes.
 *
 * Two rules the prompt leans on hard, because a confident wrong number is much
 * worse here than a blank one:
 *   · anything not stated in the text comes back null, never guessed;
 *   · the price is only read when the text actually names one.
 */
import Anthropic from '@anthropic-ai/sdk';

/** Mirrors the writable half of the Property model in prisma/schema.prisma. */
export interface ListingDraft {
  titles: string[];
  description: string;
  type: string | null;
  listingType: 'Buy' | 'Rent' | 'Short Stay' | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  price: number | null;
  priceUnit: 'sale' | 'monthly' | 'nightly' | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  amenities: string[];
  tags: string[];
  /** Field names that were NOT in the source text and still need the agent. */
  missing: string[];
  /** Language the agent wrote in, as a BCP-47-ish tag. */
  sourceLanguage: string | null;
}

/** Given to the model as a strict schema so the response cannot drift. */
const DRAFT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'titles', 'description', 'type', 'listingType', 'bedrooms', 'bathrooms',
    'area', 'price', 'priceUnit', 'city', 'neighborhood', 'address',
    'amenities', 'tags', 'missing', 'sourceLanguage',
  ],
  properties: {
    titles: {
      type: 'array', minItems: 3, maxItems: 3, items: { type: 'string', maxLength: 90 },
      description: 'Three distinct titles. Each leads with a different hook: the neighbourhood, the size/standout number, the best feature. No marketing filler.',
    },
    description: {
      type: 'string',
      description: 'Two or three plain paragraphs for the listing page. Only facts present in the source text.',
    },
    type: { type: ['string', 'null'], description: 'Villa, Apartment, Townhouse, Plot, Office, Warehouse, Guest lodge, etc.' },
    listingType: { type: ['string', 'null'], enum: ['Buy', 'Rent', 'Short Stay', null] },
    bedrooms: { type: ['integer', 'null'] },
    bathrooms: { type: ['integer', 'null'] },
    area: { type: ['number', 'null'], description: 'Square metres.' },
    price: { type: ['number', 'null'], description: 'Numeric amount only, no separators. Null unless the text names a price.' },
    priceUnit: { type: ['string', 'null'], enum: ['sale', 'monthly', 'nightly', null] },
    city: { type: ['string', 'null'] },
    neighborhood: { type: ['string', 'null'] },
    address: { type: ['string', 'null'], description: 'Only a real street address. A neighbourhood name is not an address.' },
    amenities: { type: 'array', items: { type: 'string' }, description: 'Short noun phrases: Pool, Garden, Generator, Air conditioning.' },
    tags: { type: 'array', items: { type: 'string' }, description: 'At most five search keywords.' },
    missing: { type: 'array', items: { type: 'string' }, description: 'Names of the fields above left null because the text did not state them.' },
    sourceLanguage: { type: ['string', 'null'] },
  },
} as const;

const SYSTEM = `You draft property listings for House in Mozambique, a Mozambican property marketplace.

An agent gives you whatever they already wrote about a property — rough notes, a WhatsApp message, or a full description, in Portuguese or English. You turn it into a structured draft the agent then corrects.

Rules, in order of importance:

1. NEVER invent a fact. If the text does not state something, return null for it and name that field in "missing". A blank field costs the agent ten seconds; a wrong one can misrepresent a property in a legal listing.
2. Only read a price if the text names one. "negociável" or "negotiable" is not a price. Prices are in Mozambican metical (MT) unless the text clearly says otherwise.
3. Write the titles and description in ENGLISH even when the source is Portuguese — the site's default locale is English and a Portuguese version is produced separately. Keep Portuguese proper nouns exactly as written (Sommerschield, Ponta d'Ouro, Costa do Sol).
4. Titles are what a buyer sees in a list of search results. Lead with the concrete thing that distinguishes this property. No "stunning", "luxurious", "dream home", "nestled", or any phrase that would fit any property.
5. The description states what the property is and has. No sales pitch, no invented neighbourhood history, no second-person address to the reader.
6. Infer listingType from the language of the text: an asking price means Buy, a monthly rent means Rent, a nightly rate means Short Stay. If it is genuinely unclear, return null.`;

let cached: Anthropic | null = null;

function client(): Anthropic {
  if (!cached) cached = new Anthropic();
  return cached;
}

/** True when the drafting feature can actually run. */
export function draftingAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function draftListing(sourceText: string): Promise<ListingDraft> {
  const message = await client().messages.create({
    model: 'claude-opus-5',
    max_tokens: 4096,
    system: SYSTEM,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: DRAFT_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: `Draft a listing from this. Remember: anything the text does not state comes back null and goes in "missing".\n\n---\n${sourceText}\n---`,
      },
    ],
  } as Anthropic.MessageCreateParamsNonStreaming);

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  if (!text.trim()) {
    throw new Error('The model returned no draft.');
  }

  return JSON.parse(text) as ListingDraft;
}
