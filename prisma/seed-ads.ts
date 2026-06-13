import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding example advertisements…');
  await prisma.advertisement.deleteMany();

  const ads = [
    // ── top_banner: 3 ads → carousel just below hero ──────────────────────
    {
      title: 'Discover Mozambique\'s Finest Beachfront Villas',
      description: 'Exclusive coastal properties — from Ponta do Ouro to Pemba',
      imageUrl: null,
      linkUrl: '/properties?listingType=Buy',
      linkText: 'Explore Villas →',
      position: 'top_banner',
      type: 'banner',
      bgColor: '#002045',
      textColor: '#ffffff',
      accentColor: '#f4a61d',
      isActive: true,
      sortOrder: 0,
    },
    {
      title: 'Your Dream Home Awaits — BCI Mortgage from 7.5%',
      description: 'Pre-approval in minutes · No hidden fees',
      imageUrl: null,
      linkUrl: 'https://bci.co.mz',
      linkText: 'Apply Now →',
      position: 'top_banner',
      type: 'banner',
      bgColor: '#0d3b2e',
      textColor: '#ffffff',
      accentColor: '#4ade80',
      isActive: true,
      sortOrder: 1,
    },
    {
      title: 'List Your Property — Reach 50,000+ Buyers',
      description: 'Free for the first 30 days · Professional photos included',
      imageUrl: null,
      linkUrl: '/post-property',
      linkText: 'List for Free →',
      position: 'top_banner',
      type: 'banner',
      bgColor: '#3b1f6e',
      textColor: '#ffffff',
      accentColor: '#c084fc',
      isActive: true,
      sortOrder: 2,
    },

    // ── below_header: 3 ads → auto-carousel strip at top ─────────────────
    {
      title: 'Finance Your Dream Home — BCI Bank',
      description: 'Mortgage rates from 7.5% · Pre-approval in minutes',
      imageUrl: null,
      linkUrl: 'https://bci.co.mz',
      linkText: 'Apply Now →',
      position: 'below_header',
      type: 'banner',
      bgColor: '#0d1f36',
      textColor: '#ffffff',
      accentColor: '#f4a61d',
      isActive: true,
      sortOrder: 0,
    },
    {
      title: 'List Your Property — Reach 50,000+ Buyers',
      description: 'Post your listing today and get qualified leads fast',
      imageUrl: null,
      linkUrl: '/post-property',
      linkText: 'List for Free →',
      position: 'below_header',
      type: 'banner',
      bgColor: '#1a3c5e',
      textColor: '#ffffff',
      accentColor: '#f4a61d',
      isActive: true,
      sortOrder: 1,
    },
    {
      title: 'New Luxury Condos in Maputo — from $85,000',
      description: 'Secure your unit before launch — limited availability',
      imageUrl: null,
      linkUrl: '/properties',
      linkText: 'View Condos →',
      position: 'below_header',
      type: 'banner',
      bgColor: '#2d1a3c',
      textColor: '#ffffff',
      accentColor: '#c084fc',
      isActive: true,
      sortOrder: 2,
    },

    // ── after_featured: 2 ads → side-by-side row ──────────────────────────
    {
      title: 'Home Insurance from 1,200 MT/mo',
      description: 'Seguradora Nacional — fire, flood & theft coverage',
      imageUrl: null,
      linkUrl: '#',
      linkText: 'Get a Quote →',
      position: 'after_featured',
      type: 'card_row',
      bgColor: '#ffffff',
      textColor: '#111111',
      accentColor: '#2a7d40',
      isActive: true,
      sortOrder: 0,
    },
    {
      title: 'Professional Property Valuation',
      description: 'Know your home\'s worth — certified surveyors, 48h report',
      imageUrl: null,
      linkUrl: '#',
      linkText: 'Book Now →',
      position: 'after_featured',
      type: 'card_row',
      bgColor: '#ffffff',
      textColor: '#111111',
      accentColor: '#c97000',
      isActive: true,
      sortOrder: 1,
    },

    // ── between_cities_1: single card ────────────────────────────────────
    {
      title: 'Relocating to Mozambique? We Handle the Move.',
      description: 'Professional movers across all provinces — free quote',
      imageUrl: null,
      linkUrl: '#',
      linkText: 'Get Quote →',
      position: 'between_cities_1',
      type: 'strip',
      bgColor: '#ffffff',
      textColor: '#111111',
      accentColor: '#845326',
      isActive: true,
      sortOrder: 0,
    },

    // ── between_cities_2: single card ────────────────────────────────────
    {
      title: 'Virtual Property Tours — View in 3D from Anywhere',
      description: 'Explore any listing before you fly in',
      imageUrl: null,
      linkUrl: '#',
      linkText: 'Try a Tour →',
      position: 'between_cities_2',
      type: 'strip',
      bgColor: '#ffffff',
      textColor: '#111111',
      accentColor: '#3a52c4',
      isActive: true,
      sortOrder: 0,
    },

    // ── sidebar_strip: 3 ads → three-column row ───────────────────────────
    {
      title: 'Furnished Apartments — Short Stay',
      description: 'Fully equipped from 3,500 MT/night',
      imageUrl: null,
      linkUrl: '/properties',
      linkText: 'Browse →',
      position: 'sidebar_strip',
      type: 'card_row',
      bgColor: '#ffffff',
      textColor: '#111111',
      accentColor: '#002045',
      isActive: true,
      sortOrder: 0,
    },
    {
      title: 'Solar Power Solutions for Homes',
      description: 'Cut your electricity bill by 70%',
      imageUrl: null,
      linkUrl: '#',
      linkText: 'Learn More →',
      position: 'sidebar_strip',
      type: 'card_row',
      bgColor: '#ffffff',
      textColor: '#111111',
      accentColor: '#d97706',
      isActive: true,
      sortOrder: 1,
    },
    {
      title: 'Legal Services for Property Buyers',
      description: 'Trusted lawyers for contracts & title deeds',
      imageUrl: null,
      linkUrl: '#',
      linkText: 'Contact →',
      position: 'sidebar_strip',
      type: 'card_row',
      bgColor: '#ffffff',
      textColor: '#111111',
      accentColor: '#7c3aed',
      isActive: true,
      sortOrder: 2,
    },

    // ── before_footer ─────────────────────────────────────────────────────
    {
      title: 'Partner With Us — Become a Listed Agent',
      description: 'Join 200+ agents already growing their business on our platform',
      imageUrl: null,
      linkUrl: '/agents',
      linkText: 'Partner With Us →',
      position: 'before_footer',
      type: 'banner',
      bgColor: '#1a3c5e',
      textColor: '#ffffff',
      accentColor: '#f4a61d',
      isActive: true,
      sortOrder: 0,
    },
  ];

  for (const ad of ads) {
    await prisma.advertisement.create({ data: ad });
    console.log(`  ✓ ${ad.position.padEnd(18)} [${ad.type}]  ${ad.title}`);
  }

  console.log(`\nDone — ${ads.length} ads seeded across 7 positions.`);
  console.log('\nPosition summary:');
  console.log('  top_banner      → 3 ads → AUTO CAROUSEL (below hero)');
  console.log('  below_header    → 3 ads → AUTO CAROUSEL');
  console.log('  after_featured  → 2 ads → SIDE-BY-SIDE ROW');
  console.log('  between_cities_1 → 1 ad  → SINGLE');
  console.log('  between_cities_2 → 1 ad  → SINGLE');
  console.log('  sidebar_strip   → 3 ads → THREE-COLUMN ROW');
  console.log('  before_footer   → 1 ad  → SINGLE');
}

main()
  .catch((e) => { console.log(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
