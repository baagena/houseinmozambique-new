/**
 * Where somebody goes once they are signed in.
 *
 * Three places used to answer this question, each slightly differently: the
 * sign-in handler, the sign-up handler, and the pricing table. They all still
 * pointed `?redirect=` at `/post-property` — the old single-page form — months
 * after the guided wizard at /dashboard/agent/new replaced it for new
 * listings. So `/auth?redirect=/post-property&plan=per-house` sent a paying
 * agent to the form we no longer want anyone starting from.
 *
 * `/post-property` cannot simply go: it is still the EDIT form, reached as
 * `?edit=<id>` from the agent dashboard and the listings table. So the rule is
 * about intent rather than the path — posting something new goes to the
 * wizard, editing something that exists stays where it is.
 *
 * Pure string work, no imports, so the server guard and the two client
 * handlers can share one answer instead of drifting apart again.
 */

export const AGENT_HOME = '/dashboard/agent';
export const ADMIN_HOME = '/dashboard/admin';
/** The guided form. The only way to START a listing. */
export const NEW_LISTING = '/dashboard/agent/new';

/** The paths that used to mean "post a property" and now mean the wizard. */
const LEGACY_POST_PATHS = new Set(['/post-property', '/post-listing']);

/**
 * A redirect target we are willing to send a browser to.
 *
 * `?redirect=` is attacker-controlled — it arrives in a link somebody can
 * email. Anything that could leave this origin is dropped rather than
 * sanitised, because a half-cleaned URL is the one that gets through:
 * `//evil.example` is protocol-relative, a backslash is a slash to some
 * parsers, and `https:` needs no explanation.
 */
function samePath(raw: string | null | undefined): string | null {
  const value = (raw ?? '').trim();
  if (!value || value === '/') return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//') || /\\/.test(value)) return null;
  if (/^\/+[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  return value;
}

/** Append `?plan=` without clobbering one the target already carries. */
function withPlan(path: string, plan: string | null | undefined): string {
  const slug = (plan ?? '').trim();
  if (!slug) return path;
  if (/[?&]plan=/.test(path)) return path;
  return `${path}${path.includes('?') ? '&' : '?'}plan=${encodeURIComponent(slug)}`;
}

/**
 * Point a legacy posting target at the wizard — unless it is an edit.
 *
 * `?edit=<id>` and `?as=admin` are the two live uses of /post-property and
 * both keep working exactly as they are. Everything else arriving at that path
 * is somebody trying to create a listing, and they belong in the wizard.
 */
export function normalizeListingTarget(path: string): string {
  const [route, query = ''] = path.split('?');
  if (!LEGACY_POST_PATHS.has(route)) return path;

  const params = new URLSearchParams(query);
  if (params.get('edit') || params.get('as')) return path;

  return withPlan(NEW_LISTING, params.get('plan'));
}

/**
 * The destination for a visitor who has just signed in — or who was already
 * signed in when they asked for the sign-in page.
 */
export function afterAuth(
  redirect: string | null | undefined,
  opts: { isAdmin?: boolean; plan?: string | null } = {},
): string {
  const { isAdmin = false, plan = null } = opts;

  const requested = samePath(redirect);
  if (!requested) return isAdmin ? ADMIN_HOME : AGENT_HOME;

  const target = normalizeListingTarget(requested);

  /* An admin following an agent-only link lands on their own console. They do
     not have an agent dashboard to be dropped into. */
  if (isAdmin && target.startsWith('/dashboard/agent')) return ADMIN_HOME;

  return withPlan(target, plan);
}
