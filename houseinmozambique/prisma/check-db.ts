import { PrismaClient } from '@prisma/client';

async function check() {
  const prisma = new PrismaClient();
  try {
    const propertyCount = await prisma.property.count();
    const properties = await prisma.property.findMany({
      include: { host: true }
    });
    console.log('Total properties in DB:', propertyCount);
    console.log('Properties:', JSON.stringify(properties, null, 2));

    const agentCount = await prisma.agent.count();
    console.log('Total agents in DB:', agentCount);
    
    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

check();
