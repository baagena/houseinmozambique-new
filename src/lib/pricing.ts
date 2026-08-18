import type { Language } from './translations';

/** A single bullet inside a plan card. `star` renders the gold "stars" icon. */
export interface PlanFeature {
  label: string;
  included: boolean;
  star: boolean;
}

/** The bilingual record as the super admin edits it. */
export interface PricingPlanRecord {
  id: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  highlighted: boolean;
  /** "checkout" sends the visitor to /post-property, "contact" to /contact. */
  ctaMode: 'checkout' | 'contact';
  nameEn: string;
  namePt: string;
  descriptionEn: string;
  descriptionPt: string;
  priceEn: string;
  pricePt: string;
  unitEn: string;
  unitPt: string;
  badgeEn: string | null;
  badgePt: string | null;
  ctaEn: string;
  ctaPt: string;
  featuresEn: PlanFeature[];
  featuresPt: PlanFeature[];
}

/** One plan already resolved to the visitor's language, as the cards consume it. */
export interface PricingPlanView {
  slug: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  badge: string | null;
  cta: string;
  ctaMode: 'checkout' | 'contact';
  highlighted: boolean;
  features: PlanFeature[];
}

const feature = (label: string, included = true, star = false): PlanFeature => ({
  label,
  included,
  star,
});

/**
 * Shipped defaults. They are what the public page falls back to when the table
 * is empty or unreachable, and what the admin screen seeds on first visit.
 */
export const DEFAULT_PRICING_PLANS: Omit<PricingPlanRecord, 'id'>[] = [
  {
    slug: 'standard',
    sortOrder: 0,
    isActive: true,
    highlighted: false,
    ctaMode: 'checkout',
    nameEn: 'Standard (Free)',
    namePt: 'Standard (Grátis)',
    descriptionEn: 'Perfect for individual homeowners looking to populate initial inventory.',
    descriptionPt: 'Perfeito para proprietários individuais que procuram listar seu imóvel.',
    priceEn: 'Free',
    pricePt: 'Grátis',
    unitEn: '',
    unitPt: '',
    badgeEn: null,
    badgePt: null,
    ctaEn: 'List Now',
    ctaPt: 'Publicar Agora',
    featuresEn: [
      feature('1 Free Property Listing'),
      feature('15 High-res Photos'),
      feature('Basic Property Information'),
      feature('Email Support'),
      feature('Featured Listing', false),
      feature('Analytics Dashboard', false),
    ],
    featuresPt: [
      feature('1 Listagem de Imóvel Grátis'),
      feature('15 Fotos em Alta Resolução'),
      feature('Informações Básicas do Imóvel'),
      feature('Suporte por Email'),
      feature('Listagem em Destaque', false),
      feature('Painel de Análise', false),
    ],
  },
  {
    slug: 'premium',
    sortOrder: 1,
    isActive: true,
    highlighted: true,
    ctaMode: 'checkout',
    nameEn: 'Premium',
    namePt: 'Premium',
    descriptionEn: 'For small real estate agencies wanting to establish their presence.',
    descriptionPt: 'Para pequenas agências imobiliárias que querem estabelecer sua presença.',
    priceEn: '3,000 - 5,000',
    pricePt: '3.000 - 5.000',
    unitEn: 'Mt / month',
    unitPt: 'Mt / mês',
    badgeEn: 'Popular',
    badgePt: 'Popular',
    ctaEn: 'Get Started',
    ctaPt: 'Começar',
    featuresEn: [
      feature('Up to 15 Listings', true, true),
      feature('Featured Exposure (7 Days)', true, true),
      feature('30 Photos per Property'),
      feature('Social Media Promotion'),
      feature('Priority Email Support'),
      feature('Basic Analytics'),
    ],
    featuresPt: [
      feature('Até 15 Anúncios', true, true),
      feature('Exposição em Destaque (7 Dias)', true, true),
      feature('30 Fotos por Imóvel'),
      feature('Promoção nas Redes Sociais'),
      feature('Suporte Prioritário'),
      feature('Análise Básica'),
    ],
  },
  {
    slug: 'pro',
    sortOrder: 2,
    isActive: true,
    highlighted: false,
    ctaMode: 'contact',
    nameEn: 'Agency Pro',
    namePt: 'Pro Agência',
    descriptionEn: 'Enterprise-grade solutions for established real estate agencies.',
    descriptionPt: 'Soluções para agências imobiliárias estabelecidas.',
    priceEn: '1,500 - 2,500',
    pricePt: '1.500 - 2.500',
    unitEn: 'Mt / month',
    unitPt: 'Mt / mês',
    badgeEn: null,
    badgePt: null,
    ctaEn: 'Contact Sales',
    ctaPt: 'Contato',
    featuresEn: [
      feature('Unlimited Listings'),
      feature('Premium Placement & CRM'),
      feature('Unlimited Photos'),
      feature('Advanced Analytics & Reporting'),
      feature('Dedicated Account Manager'),
      feature('Priority Phone Support'),
    ],
    featuresPt: [
      feature('Anúncios Ilimitados'),
      feature('CRM Integrado'),
      feature('Fotos Ilimitadas'),
      feature('Análise Avançada'),
      feature('Gestor de Conta Dedicado'),
      feature('Suporte Telefónico 24/7'),
    ],
  },
];

/** Json columns come back as `unknown`; keep only well-formed feature rows. */
function parseFeatures(value: unknown): PlanFeature[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      label: String(entry.label ?? ''),
      included: entry.included !== false,
      star: entry.star === true,
    }))
    .filter((entry) => entry.label.length > 0);
}

/** Normalise a Prisma row (or a default) into a `PricingPlanRecord`. */
export function toPricingPlanRecord(row: any): PricingPlanRecord {
  return {
    id: row.id ?? row.slug,
    slug: row.slug,
    sortOrder: row.sortOrder ?? 0,
    isActive: row.isActive ?? true,
    highlighted: row.highlighted ?? false,
    ctaMode: row.ctaMode === 'contact' ? 'contact' : 'checkout',
    nameEn: row.nameEn ?? '',
    namePt: row.namePt ?? '',
    descriptionEn: row.descriptionEn ?? '',
    descriptionPt: row.descriptionPt ?? '',
    priceEn: row.priceEn ?? '',
    pricePt: row.pricePt ?? '',
    unitEn: row.unitEn ?? '',
    unitPt: row.unitPt ?? '',
    badgeEn: row.badgeEn || null,
    badgePt: row.badgePt || null,
    ctaEn: row.ctaEn ?? '',
    ctaPt: row.ctaPt ?? '',
    featuresEn: parseFeatures(row.featuresEn),
    featuresPt: parseFeatures(row.featuresPt),
  };
}

/** Collapse a bilingual record down to the fields one language needs. */
export function toPlanView(plan: PricingPlanRecord, lang: Language): PricingPlanView {
  const pt = lang === 'pt';
  return {
    slug: plan.slug,
    name: (pt ? plan.namePt : plan.nameEn) || plan.nameEn || plan.namePt,
    description: (pt ? plan.descriptionPt : plan.descriptionEn) || plan.descriptionEn,
    price: (pt ? plan.pricePt : plan.priceEn) || plan.priceEn,
    unit: pt ? plan.unitPt : plan.unitEn,
    badge: (pt ? plan.badgePt : plan.badgeEn) || null,
    cta: (pt ? plan.ctaPt : plan.ctaEn) || plan.ctaEn,
    ctaMode: plan.ctaMode,
    highlighted: plan.highlighted,
    features: (pt ? plan.featuresPt : plan.featuresEn).length
      ? pt
        ? plan.featuresPt
        : plan.featuresEn
      : plan.featuresEn,
  };
}

/** Defaults as full records, used as the fallback and by the seeder. */
export function defaultPricingPlanRecords(): PricingPlanRecord[] {
  return DEFAULT_PRICING_PLANS.map((plan) => toPricingPlanRecord(plan));
}
