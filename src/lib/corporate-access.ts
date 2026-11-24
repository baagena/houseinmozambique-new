/**
 * Corporate agency access: when an agency is listed in the public directory.
 *
 * Agencies are not asked to pay before they are verified. Staff activate an
 * agency from its admin record with a free trial or a subscription period; any
 * payment happens outside the platform and is recorded only as an extension.
 * When the period ends the agency drops out of the directory on its own — the
 * end date is the switch, no one has to remember to turn it off.
 *
 * The period is an ordinary Subscription row on any posting plan except the
 * free tier (price 0 sold by self-checkout). Enterprise is price 0 too, but it
 * is "contact" priced, so it counts.
 */

/** Plans whose subscription gives an agency directory access. */
export const CORPORATE_ACCESS_PLAN_WHERE = {
  kind: 'subscription',
  NOT: { priceMinor: 0, ctaMode: 'checkout' },
} as const;

/** Grant notes for a free trial start with this, so the trial can be shown as one. */
export const TRIAL_NOTE_PREFIX = 'Trial';

export const isTrialNote = (note: string | null | undefined) =>
  Boolean(note && note.startsWith(TRIAL_NOTE_PREFIX));

export type CorporateAccessState = 'NOT_ACTIVATED' | 'TRIAL' | 'ACTIVE' | 'ENDED' | 'DEACTIVATED' | 'DEMO';

/**
 * One label for the admin list, the admin record and the agency's own
 * dashboard. `latest` is the agency's most recent access subscription, ended
 * or not.
 */
export function corporateAccessState(
  corporateStatus: string | null | undefined,
  latest: { status: string; currentPeriodEnd: Date; grantNote: string | null } | null | undefined,
  now = new Date(),
): { state: CorporateAccessState; until: Date | null } {
  if (corporateStatus === 'DEMO') return { state: 'DEMO', until: null };
  if (corporateStatus === 'INACTIVE') return { state: 'DEACTIVATED', until: latest?.currentPeriodEnd ?? null };
  if (!latest) return { state: 'NOT_ACTIVATED', until: null };
  const running = corporateStatus === 'ACTIVE' && latest.status === 'ACTIVE' && latest.currentPeriodEnd > now;
  if (!running) return { state: 'ENDED', until: latest.currentPeriodEnd };
  return { state: isTrialNote(latest.grantNote) ? 'TRIAL' : 'ACTIVE', until: latest.currentPeriodEnd };
}

export const CORPORATE_ACCESS_LABEL: Record<CorporateAccessState, string> = {
  NOT_ACTIVATED: 'Not activated',
  TRIAL: 'Trial',
  ACTIVE: 'Active',
  ENDED: 'Ended',
  DEACTIVATED: 'Deactivated',
  DEMO: 'Demo',
};
