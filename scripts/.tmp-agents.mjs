import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const rows = await prisma.agent.findMany({
  select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true,
            _count: { select: { properties: true } } },
  orderBy: { createdAt: 'asc' },
});
for (const r of rows) {
  console.log([r.role.padEnd(6), String(r._count.properties).padStart(3), r.isVerified ? 'V' : '-', r.name, '<'+r.email+'>', r.id].join(' | '));
}
console.log('total', rows.length);
await prisma.$disconnect();
