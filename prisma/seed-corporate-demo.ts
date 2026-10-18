import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

if (!process.argv.includes('--confirm-demo-seed')) {
  throw new Error('Pass --confirm-demo-seed to add clearly labeled corporate preview profiles.');
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to seed corporate preview profiles.');

const pool = new pg.Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const previews = [
  {
    id: 'demo-corporate-baobab-advisory',
    name: 'Demo Representative One', initials: 'DR',
    email: 'baobab-preview@example.invalid',
    title: 'Agency Representative', location: 'Maputo City',
    officeAddress: 'DEMO ONLY — no public office', phone: '+258 00 000 0000',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop',
    bio: 'Illustrative representative profile for previewing the corporate agency page. This person and business are fictional.',
    agencyName: 'DEMO · Baobab Property Advisory',
    agencyPhone: '+258 00 000 0000', agencyBusinessType: 'Property consultancy',
    agencyAbout: 'DEMO PROFILE ONLY. This fictional sample shows how a company description appears. Replace it with verified information from a real agency before using the profile publicly.',
    agencyServices: ['Property consultancy', 'Investment guidance', 'Market research'],
    agencyAreasServed: ['Maputo', 'Matola'],
    agencyEmail: 'baobab-preview@example.invalid',
  },
  {
    id: 'demo-corporate-indico-homes',
    name: 'Demo Representative Two', initials: 'DR',
    email: 'indico-preview@example.invalid',
    title: 'Agency Representative', location: 'Beira',
    officeAddress: 'DEMO ONLY — no public office', phone: '+258 00 000 0000',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
    bio: 'Illustrative representative profile for previewing the corporate agency page. This person and business are fictional.',
    agencyName: 'DEMO · Índico Property Services',
    agencyPhone: '+258 00 000 0000', agencyBusinessType: 'Property management',
    agencyAbout: 'DEMO PROFILE ONLY. This fictional sample demonstrates a different company profile and service mix. It makes no claims about a real business or its results.',
    agencyServices: ['Property management', 'Brokerage', 'Commercial real estate'],
    agencyAreasServed: ['Beira', 'Dondo', 'Nationwide by arrangement'],
    agencyEmail: 'indico-preview@example.invalid',
  },
];

async function main() {
  const password = await bcrypt.hash('demo-only-password-not-for-login', 10);
  const verifiedAt = new Date();
  for (const preview of previews) {
    const data = {
      ...preview,
      role: 'AGENT',
      emailVerifiedAt: verifiedAt,
      password,
      rating: 0,
      reviewCount: 0,
      isFeatured: false,
      isVerified: false,
      isHidden: false,
      yearsExperience: 8,
      specializations: preview.agencyServices,
      corporateStatus: 'DEMO',
    };
    await prisma.agent.upsert({ where: { id: preview.id }, create: data, update: data });
    console.log(`Seeded preview: ${preview.agencyName}`);
  }
}

main().catch((error) => {
  console.error('Could not seed corporate preview profiles:', error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
