import { prisma } from './db';
import { AGENT_PUBLIC, AGENT_ADMIN_LIST } from './dto';
import { hostIdentity, type HostLike } from './host-identity';

/**
 * The agent attached to a listing.
 *
 * `include: { host: true }` returns every Agent column, and a property is handed
 * to PropertyDetailClient — a CLIENT component — so that whole row is serialised
 * into the RSC flight payload of the page. The bcrypt password hash, the account
 * email and the live password-reset token were all being served in the HTML of
 * every public listing, to anyone who pressed View Source.
 *
 * Select the allow-list instead. sanitizeHost() in mobile-serialize.ts is now
 * belt-and-braces rather than the only thing between the hash and the internet.
 */
const HOST_PUBLIC = { select: AGENT_PUBLIC } as const;

/**
 * The subscription behind a plan-backed listing, for its expiry date only.
 *
 * Three columns, not the whole row: a Subscription carries the agent's grant
 * notes and payment id, none of which belongs on a public page.
 */
const LIFECYCLE_SUB = {
  select: { status: true, currentPeriodEnd: true, graceUntil: true },
} as const;

/** Admin tables legitimately show the account email — still never the hash. */
const HOST_ADMIN = { select: AGENT_ADMIN_LIST } as const;

/**
 * Apply the public byline to a query result.
 *
 * Every component that prints a seller already calls hostIdentity(), but the
 * whole host row is also serialised into the RSC payload of each public page,
 * so "System Administrator" sat in the page source of every property even once
 * the visible byline read House in Mozambique. Rewriting it here means the
 * rendered text, the structured data and the page source all agree, and there
 * is one place to change it.
 *
 * Public queries only. getPropertiesForAdmin() uses HOST_ADMIN and is left
 * alone on purpose: staff need to know which real account posted a listing.
 */
function brandHost<T extends { host?: HostLike | null }>(row: T): T {
  const identity = hostIdentity(row.host);
  if (!identity?.isHouse || !row.host) return row;
  return {
    ...row,
    host: { ...row.host, name: identity.name, initials: identity.initials },
  };
}

export async function getProperties(filters: {
  listingType?: string;
  city?: string;
  propertyType?: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  skip?: number;
  take?: number;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
} = {}) {
  const { listingType, city, propertyType, minPrice, maxPrice, bedrooms, bathrooms, skip, take, sort } = filters;

  const orderBy =
    sort === 'oldest' ? { createdAt: 'asc' as const } :
    sort === 'price_asc' ? { price: 'asc' as const } :
    sort === 'price_desc' ? { price: 'desc' as const } :
    { createdAt: 'desc' as const };

  const rows = await prisma.property.findMany({
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
    include: { host: HOST_PUBLIC, subscription: LIFECYCLE_SUB },
    orderBy,
    ...(skip !== undefined && { skip }),
    ...(take !== undefined && { take }),
  });
  return rows.map(brandHost);
}

export async function countProperties(filters: {
  listingType?: string;
  city?: string;
  propertyType?: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
} = {}) {
  const { listingType, city, propertyType, minPrice, maxPrice, bedrooms, bathrooms } = filters;

  return await prisma.property.count({
    where: {
      status: 'PUBLISHED',
      ...(listingType && { listingType }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(propertyType && propertyType.length > 0 && { type: { in: propertyType } }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(bedrooms !== undefined && { bedrooms: { gte: bedrooms } }),
      ...(bathrooms !== undefined && { bathrooms: { gte: bathrooms } }),
    },
  });
}

export async function getPropertiesForAdmin() {
  return await prisma.property.findMany({
    include: { host: HOST_ADMIN },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFeaturedProperties() {
  const rows = await prisma.property.findMany({
    where: { 
      isFeatured: true,
      status: 'PUBLISHED',
    },
    include: { host: HOST_PUBLIC, subscription: LIFECYCLE_SUB },
    take: 6,
  });
  return rows.map(brandHost);
}

export async function getPropertyById(id: string) {
  const row = await prisma.property.findUnique({
    where: { id },
    include: { host: HOST_PUBLIC, subscription: LIFECYCLE_SUB },
  });
  return row && brandHost(row);
}

/**
 * Who the public agent directory is allowed to show.
 *
 * Two exclusions, for two different reasons.
 *
 * `role: 'AGENT'` keeps private owners and staff out: owners get the same
 * listing tools but are not advertising themselves as agents, and staff are
 * not for hire.
 *
 * `isHidden: false` keeps demo, test and store-review accounts out. Those had
 * been sitting in the live directory as if they were real estate agents
 * somebody could ring — a visitor cannot tell "Play Store Review" from a
 * small agency, and finds out by calling a number nobody answers.
 */
const DIRECTORY_VISIBLE = { role: 'AGENT', isHidden: false } as const;

export async function getAgents() {
  // `include` returns every scalar column alongside the relation, which put the
  // password hash and the reset/verify tokens into the PUBLIC /agents page.
  // Select explicitly instead.
  return await prisma.agent.findMany({
    where: DIRECTORY_VISIBLE,
    orderBy: { rating: 'desc' },
    select: { ...AGENT_PUBLIC, _count: { select: { properties: true } } },
  });
}

/**
 * Admin-only variant of getAgents(). Includes the account email, which the
 * public directory must never receive — keep the two separate rather than
 * widening getAgents().
 */
export async function getAgentsForAdmin() {
  return await prisma.agent.findMany({
    where: { role: 'AGENT' },
    orderBy: { rating: 'desc' },
    select: { ...AGENT_ADMIN_LIST, _count: { select: { properties: true } } },
  });
}

export async function getFeaturedAgents() {
  return await prisma.agent.findMany({
    where: { ...DIRECTORY_VISIBLE, isFeatured: true },
    take: 10,
    select: AGENT_PUBLIC,
  });
}

export async function getAgentById(id: string) {
  return await prisma.agent.findUnique({
    where: { id },
    select: {
      ...AGENT_PUBLIC,
      properties: true,
      inquiries: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function getPropertiesByCity(city: string) {
  const rows = await prisma.property.findMany({
    where: { 
      city: { equals: city, mode: 'insensitive' },
      status: 'PUBLISHED',
    },
    include: { host: HOST_PUBLIC, subscription: LIFECYCLE_SUB },
  });
  return rows.map(brandHost);
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
