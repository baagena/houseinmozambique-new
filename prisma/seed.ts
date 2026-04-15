import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { agents, properties } from './seed-data';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding started...');

  // 1. Seed Agents
  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: {},
      create: {
        id: agent.id,
        name: agent.name,
        initials: agent.initials,
        title: agent.title,
        location: agent.location,
        rating: agent.rating,
        reviewCount: agent.reviewCount,
        isFeatured: agent.isFeatured || false,
        isVerified: agent.isVerified || false,
        avatar: agent.avatar,
        bio: agent.bio,
        yearsExperience: agent.yearsExperience,
        specializations: agent.specializations || [],
        email: (agent as any).email,
        password: (agent as any).password,
        role: (agent as any).role || 'AGENT',
      },
    });
  }
  console.log(`Seeded ${agents.length} agents.`);

  // 2. Seed Properties
  for (const property of properties) {
    await prisma.property.upsert({
      where: { id: property.id },
      update: {},
      create: {
        id: property.id,
        title: property.title,
        description: property.description,
        location: property.location,
        city: property.city,
        neighborhood: property.location.split(',')[0], // Extracting neighborhood from location string as fallback
        address: property.location,
        price: property.price,
        priceUnit: property.priceUnit,
        type: property.type,
        listingType: property.listingType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        rating: property.rating || 0,
        reviewCount: property.reviewCount || 0,
        isFeatured: property.isFeatured || false,
        isSuperhost: property.isSuperhost || false,
        isRareFind: property.isRareFind || false,
        isNew: (property as any).isNew || false,
        isPremium: (property as any).isPremium || false,
        isGuestFavorite: (property as any).isGuestFavorite || false,
        status: (property as any).status || 'PUBLISHED',
        badge: property.badge,
        amenities: property.amenities,
        images: property.images,
        tags: (property as any).tags || [],
        hostId: property.hostId,
      },
    });
  }
  console.log(`Seeded ${properties.length} properties.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
