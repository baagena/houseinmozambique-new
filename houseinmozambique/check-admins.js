const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const agents = await prisma.agent.findMany({
      select: { id: true, name: true, role: true, email: true }
    });
    console.log('=== Agents in Database ===');
    console.log(JSON.stringify(agents, null, 2));
    
    const adminCount = agents.filter(a => a.role === 'ADMIN').length;
    console.log(`\nTotal: ${agents.length}, Admins: ${adminCount}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
