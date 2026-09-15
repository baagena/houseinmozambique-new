import { requireAdmin } from '@/lib/session';

/**
 * Resolves the signed-in super admin, or null. Returns the name too, so actions
 * taken from the dashboard can be attributed.
 *
 * Kept as a thin alias so existing call sites keep working; the actual identity
 * check lives in src/lib/session.ts. Prefer importing requireAdmin() directly in
 * new code.
 */
export async function requireAdminAgent() {
  return await requireAdmin();
}
