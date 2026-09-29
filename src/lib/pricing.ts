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
  /** Billing half of the plan. See PricingPlan in schema.prisma. */
  kind: 'subscription' | 'one_off';
  /** Centavos. 3,500 MZN is 350000. */
  priceMinor: number;
  currency: string;
  interval: 'month' | 'year' | null;
  /** Listings LIVE at once. -1 is unlimited. */
  listingQuota: number;
  featuredQuota: number;
  /** one_off only: how long the single listing stays published. */
  durationDays: number | null;
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
  /** The free tier, which the pricing page shows as a note, not a card. */
  isFree: boolean;
  /** Has a set price (false for "price on request"). */
  hasPrice: boolean;
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
 *
 * Modelled on houseinrwanda.com's posting plans: two single-listing plans that
 * put the property on the homepage (Destaque, Super Destaque), a monthly plan
 * for brokers, a price-on-request pack for developers and institutions, and a
 * free tier that is shown as a note under the cards rather than as a card.
 * Prices are deliberately low for launch; the admin edits them on
 * /dashboard/admin/pricing without a deploy.
 *
 * `featuredQuota` is honoured: a listing published under a plan with featured
 * places left is put on the homepage for the plan's run (see
 * featureFromPlan in lib/listing-addons.ts). In feature labels, **text** is
 * rendered bold.
 *
 * The paid plans are ctaMode "contact" for now: online payment is not set up
 * yet. "Pedir este plano" opens the listing wizard with the plan selected;
 * the listing waits in Approvals with the plan named, the team confirms the
 * payment, and approving activates the plan (lib/plan-requests.ts). Staff can
 * also grant a plan on the admin agent page. Switch these back to "checkout"
 * once the payment details are filled in under Admin → Settings.
 */
export const DEFAULT_PRICING_PLANS: Omit<PricingPlanRecord, 'id'>[] = [
  {
    slug: 'standard',
    kind: 'subscription' as const,
    priceMinor: 0,
    currency: 'MZN',
    interval: null,
    listingQuota: 1,
    featuredQuota: 0,
    durationDays: null,
    sortOrder: 0,
    isActive: true,
    highlighted: false,
    ctaMode: 'checkout',
    nameEn: 'Free',
    namePt: 'Grátis',
    descriptionEn: 'One listing for property owners, free of charge. It does not appear on the homepage and is reviewed before it goes online.',
    descriptionPt: 'Um anúncio para proprietários, sem custo. Não aparece na página inicial e é revisto antes de ser publicado.',
    priceEn: 'Free',
    pricePt: 'Grátis',
    unitEn: '',
    unitPt: '',
    badgeEn: null,
    badgePt: null,
    ctaEn: 'Publish for free',
    ctaPt: 'Publicar grátis',
    featuresEn: [
      feature('**1 listing** online at a time'),
      feature('Reviewed before publishing'),
      feature('Homepage placement', false),
    ],
    featuresPt: [
      feature('**1 anúncio** online de cada vez'),
      feature('Revisto antes de ser publicado'),
      feature('Destaque na página inicial', false),
    ],
  },
  {
    slug: 'featured',
    kind: 'one_off' as const,
    priceMinor: 50000,
    currency: 'MZN',
    interval: null,
    listingQuota: 1,
    featuredQuota: 1,
    durationDays: 30,
    sortOrder: 1,
    isActive: true,
    highlighted: false,
    ctaMode: 'contact', // until payments are set up — see note above
    nameEn: 'Featured',
    namePt: 'Destaque',
    descriptionEn: 'Take control: sell or rent your own property.',
    descriptionPt: 'Assuma o controlo: venda ou arrende o seu próprio imóvel.',
    priceEn: '500',
    pricePt: '500',
    unitEn: 'MZN',
    unitPt: 'MZN',
    badgeEn: null,
    badgePt: null,
    ctaEn: 'Request this plan',
    ctaPt: 'Pedir este plano',
    featuresEn: [
      feature('**Take control**, sell or rent your own property'),
      feature('Your listing is published **online quickly**'),
      feature('Listing appears on our **homepage**', true, true),
      feature('Shared on our **social media** accounts'),
      feature('Show the **exact location** of your property'),
      feature('**Contact buttons** for enquiries about your property'),
      feature('Publication period: **1 month**'),
    ],
    featuresPt: [
      feature('**Assuma o controlo**, venda ou arrende o seu imóvel'),
      feature('O seu anúncio é publicado **online rapidamente**'),
      feature('Anúncio aparece na nossa **página inicial**', true, true),
      feature('Partilhado nas nossas **redes sociais**'),
      feature('Mostre a **localização exacta** do imóvel'),
      feature('**Botões de contacto** para pedidos sobre o imóvel'),
      feature('Período de publicação: **1 mês**'),
    ],
  },
  {
    slug: 'super-featured',
    kind: 'one_off' as const,
    priceMinor: 150000,
    currency: 'MZN',
    interval: null,
    listingQuota: 1,
    featuredQuota: 1,
    durationDays: 90,
    sortOrder: 2,
    isActive: true,
    highlighted: true,
    ctaMode: 'contact', // until payments are set up — see note above
    nameEn: 'Super Featured',
    namePt: 'Super Destaque',
    descriptionEn: 'Looking for a quick sale or rental?',
    descriptionPt: 'Procura uma venda ou arrendamento rápido?',
    priceEn: '1,500',
    pricePt: '1.500',
    unitEn: 'MZN',
    unitPt: 'MZN',
    badgeEn: 'Most visible',
    badgePt: 'Mais visível',
    ctaEn: 'Request this plan',
    ctaPt: 'Pedir este plano',
    featuresEn: [
      feature('Looking for a **quick sale or rental**?'),
      feature('We take **professional photos** on request'),
      feature('Listing stays at the **top of the homepage** for maximum visibility', true, true),
      feature('Promoted with a **web banner** on our site'),
      feature('Show the **exact location** of your property'),
      feature('**Monthly views report** for your listing'),
      feature('Publication period: **3 months**'),
    ],
    featuresPt: [
      feature('Procura uma **venda ou arrendamento rápido**?'),
      feature('Tiramos **fotografias profissionais** a pedido'),
      feature('Anúncio fica no **topo da página inicial** para máxima visibilidade', true, true),
      feature('Promovido com um **banner** no nosso site'),
      feature('Mostre a **localização exacta** do imóvel'),
      feature('**Relatório mensal de visualizações** do anúncio'),
      feature('Período de publicação: **3 meses**'),
    ],
  },
  {
    slug: 'brokers',
    kind: 'subscription' as const,
    priceMinor: 200000,
    currency: 'MZN',
    interval: 'month' as const,
    listingQuota: 40,
    featuredQuota: 0,
    durationDays: null,
    sortOrder: 3,
    isActive: true,
    highlighted: false,
    ctaMode: 'contact', // until payments are set up — see note above
    nameEn: 'Brokers Subscription',
    namePt: 'Subscrição de Agentes',
    descriptionEn: 'Reserved for real estate brokers and agencies.',
    descriptionPt: 'Reservada a agentes e agências imobiliárias.',
    priceEn: '2,000',
    pricePt: '2.000',
    unitEn: 'MZN/month',
    unitPt: 'MZN/mês',
    badgeEn: null,
    badgePt: null,
    ctaEn: 'Request this plan',
    ctaPt: 'Pedir este plano',
    featuresEn: [
      feature('Reserved for **real estate brokers**'),
      feature('Up to **40 listings** online at a time'),
      feature('**Edit your listings** at any time'),
      feature('Dedicated **support** by phone and WhatsApp'),
      feature('We promote your **own website**, if you have one'),
      feature('Your own **agent profile** on the platform'),
      feature('Publication period: **1 month**, renewable'),
    ],
    featuresPt: [
      feature('Reservada a **agentes imobiliários**'),
      feature('Até **40 anúncios** online de cada vez'),
      feature('**Edite os seus anúncios** a qualquer momento'),
      feature('**Apoio dedicado** por telefone e WhatsApp'),
      feature('Promovemos o seu **site próprio**, se tiver'),
      feature('O seu **perfil de agente** na plataforma'),
      feature('Período de publicação: **1 mês**, renovável'),
    ],
  },
  {
    slug: 'enterprise',
    kind: 'subscription' as const,
    priceMinor: 0,
    currency: 'MZN',
    interval: 'month' as const,
    listingQuota: -1,
    featuredQuota: 5,
    durationDays: null,
    sortOrder: 4,
    isActive: true,
    highlighted: false,
    ctaMode: 'contact',
    nameEn: 'Enterprise Pack',
    namePt: 'Pacote Empresarial',
    descriptionEn: 'For developers, auctioneers and financial institutions.',
    descriptionPt: 'Para promotores, leiloeiros e instituições financeiras.',
    priceEn: 'Price on request',
    pricePt: 'Sob consulta',
    unitEn: '',
    unitPt: '',
    badgeEn: null,
    badgePt: null,
    ctaEn: 'Contact us',
    ctaPt: 'Contacte-nos',
    featuresEn: [
      feature('Need a **strong online presence**?'),
      feature('For **developers, auctioneers, banks** and other professionals'),
      feature('**Unlimited listings** online'),
      feature('Your listings stay at the **top of the homepage**', true, true),
      feature('We create **banners, articles and videos** for your projects'),
      feature('Publication period: **up to 3 months**'),
    ],
    featuresPt: [
      feature('Precisa de uma **forte presença online**?'),
      feature('Para **promotores, leiloeiros, bancos** e outros profissionais'),
      feature('**Anúncios ilimitados** online'),
      feature('Os seus anúncios ficam no **topo da página inicial**', true, true),
      feature('Criamos **banners, artigos e vídeos** para os seus projectos'),
      feature('Período de publicação: **até 3 meses**'),
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
    kind: row.kind === 'one_off' ? 'one_off' : 'subscription',
    priceMinor: Number(row.priceMinor ?? 0),
    currency: row.currency ?? 'MZN',
    interval: row.interval === 'year' ? 'year' : row.interval === 'month' ? 'month' : null,
    listingQuota: Number(row.listingQuota ?? 1),
    featuredQuota: Number(row.featuredQuota ?? 0),
    durationDays: row.durationDays == null ? null : Number(row.durationDays),
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
    isFree: plan.priceMinor === 0 && plan.ctaMode !== 'contact',
    hasPrice: plan.priceMinor > 0,
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
