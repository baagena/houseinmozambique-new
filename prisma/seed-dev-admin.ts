import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// The platform has a single privilege tier above agents: role === 'ADMIN'
// unlocks every dashboard guard (src/lib/admin-guard.ts and friends), so this
// account can make any change the admin dashboard exposes.
const EMAIL = process.env.DEV_ADMIN_EMAIL || 'dev@houseinmoz.com';
const PASSWORD = process.env.DEV_ADMIN_PASSWORD || 'Password@@';

async function main() {
  const password = await bcrypt.hash(PASSWORD, 10);

  const admin = await prisma.agent.upsert({
    where: { email: EMAIL },
    // Re-running this resets the password and re-grants ADMIN, which is the
    // point: it is the recovery path when the dev account gets locked out.
    update: {
      password,
      role: 'ADMIN',
      isVerified: true,
    },
    create: {
      email: EMAIL,
      password,
      name: 'Dev Administrator',
      initials: 'DA',
      title: 'Platform Developer',
      location: 'Maputo HQ',
      role: 'ADMIN',
      isVerified: true,
      isFeatured: false,
      rating: 5,
      reviewCount: 0,
      yearsExperience: 10,
      bio: 'Developer account with full platform access.',
      specializations: ['Platform Oversight'],
    },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log('Dev admin ready:', admin);
  console.log(`Sign in at /auth with ${EMAIL} — you will land on /dashboard/admin.`);
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
