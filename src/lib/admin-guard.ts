import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

/**
 * Resolves the signed-in super admin, or null. Returns the name too, so actions
 * taken from the dashboard can be attributed.
 */
export async function requireAdminAgent() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return null;

  const agent = await prisma.agent.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  return agent?.role === 'ADMIN' ? agent : null;
}
