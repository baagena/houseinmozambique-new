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
    include: { 
      properties: true,
      inquiries: {
        orderBy: { createdAt: 'desc' }
      }
    },
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
  const [propertyCount, agentCount, totalInquiries, totalRevenue] = await Promise.all([
    prisma.property.count({ where: { status: 'PUBLISHED' } }),
    prisma.agent.count(),
    prisma.inquiry.count(),
    prisma.property.aggregate({
      _sum: { price: true },
      where: { status: 'PUBLISHED' }
    })
  ]);

  return {
    propertyCount,
    agentCount,
    totalInquiries,
    totalRevenue: totalRevenue._sum.price || 0,
  };
}

export async function getChartData() {
  // Get properties created in last 30 days grouped by day
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const properties = await prisma.property.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true, price: true, status: true }
  });

  const agents = await prisma.agent.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true }
  });

  const inquiries = await prisma.inquiry.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true }
  });

  // Group by date
  const dateMap = new Map();
  
  properties.forEach(p => {
    const date = p.createdAt.toISOString().split('T')[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, { properties: 0, agents: 0, inquiries: 0, revenue: 0 });
    }
    const data = dateMap.get(date);
    data.properties++;
    data.revenue += p.price || 0;
  });

  agents.forEach(a => {
    const date = a.createdAt.toISOString().split('T')[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, { properties: 0, agents: 0, inquiries: 0, revenue: 0 });
    }
    dateMap.get(date).agents++;
  });

  inquiries.forEach(i => {
    const date = i.createdAt.toISOString().split('T')[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, { properties: 0, agents: 0, inquiries: 0, revenue: 0 });
    }
    dateMap.get(date).inquiries++;
  });

  // Convert to array sorted by date
  const chartData = Array.from(dateMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...data
    }));

  return chartData;
}
