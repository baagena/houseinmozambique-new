import { prisma } from './db';

export async function getProperties(filters: {
  listingType?: string;
  city?: string;
  propertyType?: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
} = {}) {
  const { listingType, city, propertyType, minPrice, maxPrice, bedrooms, bathrooms } = filters;

  return await prisma.property.findMany({
    where: {
      status: 'PUBLISHED', // Only show published by default
      ...(listingType && { listingType }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(propertyType && propertyType.length > 0 && { type: { in: propertyType } }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(bedrooms !== undefined && { bedrooms: { gte: bedrooms } }),
      ...(bathrooms !== undefined && { bathrooms: { gte: bathrooms } }),
    },
    include: { host: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPropertiesForAdmin() {
  return await prisma.property.findMany({
    include: { host: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFeaturedProperties() {
  return await prisma.property.findMany({
    where: { 
      isFeatured: true,
      status: 'PUBLISHED',
    },
    include: { host: true },
    take: 6,
  });
}

export async function getPropertyById(id: string) {
  return await prisma.property.findUnique({
    where: { id },
    include: { host: true },
  });
}

export async function getAgents() {
  return await prisma.agent.findMany({
    orderBy: { rating: 'desc' },
    include: { _count: { select: { properties: true } } },
  });
}

export async function getFeaturedAgents() {
  return await prisma.agent.findMany({
    where: { isFeatured: true },
    take: 10,
  });
}

export async function getAgentById(id: string) {
  return await prisma.agent.findUnique({
    where: { id },
    include: { properties: true },
  });
}

export async function getPropertiesByCity(city: string) {
  return await prisma.property.findMany({
    where: { 
      city: { equals: city, mode: 'insensitive' },
      status: 'PUBLISHED',
    },
    include: { host: true },
  });
}

export async function getPlatformStats() {
  const [propertyCount, agentCount] = await Promise.all([
    prisma.property.count({ where: { status: 'PUBLISHED' } }),
    prisma.agent.count(),
  ]);

  return {
    propertyCount,
    agentCount,
  };
}
