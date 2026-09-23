/**
 * What goes in the home page's featured slot, and why.
 *
 * Three rules from featured-slot/README.md, all of them about failure rather
 * than the happy path — because a featured slot that breaks, empties, or
 * silently shows last month's pick is worse than not having one.
 *
 *   · THE FALLBACK IS DESIGNED. When nobody picked anything the slot fills
 *     itself from the newest listing that clears a quality bar, and the label
 *     changes so the page never claims a human chose it.
 *   · ELIGIBILITY IS CHECKED AT RENDER, not when the pick was made. The most
 *     prominent property on the site cannot be one nobody can buy.
 *   · AN EDITOR'S PICK EXPIRES. Fourteen days, after which it becomes the
 *     automatic fallback with the honest label, whether or not anyone noticed.
 *
 * If nothing clears the bar the slot returns null and the caller removes the
 * block from the page rather than rendering it empty.
 */

import { prisma } from '@/lib/db';

/** Editor's pick lifetime, in days. */
export const PICK_DAYS = 14;

/** The bar the automatic fallback has to clear. */
export const FALLBACK_MIN_PHOTOS = 8;

export type FeaturedKind = 'EDITOR' | 'PAID' | 'AUTO';

export interface FeaturedSlot {
  property: Record<string, unknown>;
  kind: FeaturedKind;
  /** EDITOR only — the reviewer's own sentence. Never machine-written. */
  note: string | null;
  notePt: string | null;
  reviewerName: string | null;
  endsAt: Date | null;
}

/**
 * Whether a property may occupy the slot at all.
 *
 * Deliberately a separate check from "was it picked". A pick made a fortnight
 * ago says nothing about whether the property is still for sale this morning.
 */
function eligibleWhere() {
  return {
    status: 'PUBLISHED',
    /*
     * The slot is 60% photograph. A listing whose images have not cleared the
     * gate is not eligible however good the property is — and one with a
     * single photograph looks broken in a block this size.
     */
    images: { isEmpty: false },
  } as const;
}

const WITH_HOST = {
  host: {
    select: {
      id: true, name: true, initials: true, title: true, avatar: true,
      isVerified: true, phone: true,
      // hostIdentity() needs the role to decide whether this listing is the
      // platform's own; without it a staff listing keeps the account byline.
      role: true,
    },
  },
  subscription: { select: { status: true, currentPeriodEnd: true, graceUntil: true } },
} as const;

/**
 * The slot's contents, or null to remove the block.
 *
 * Order is the point: an editor's pick outranks a paid placement, always. A
 * marketplace that lets money outrank its own review team has nothing left to
 * sell.
 */
export async function featuredSlot(): Promise<FeaturedSlot | null> {
  const now = new Date();

  const picks = await prisma.featurePick.findMany({
    where: {
      startsAt: { lte: now },
      endsAt: { gt: now },
      property: eligibleWhere(),
    },
    orderBy: [{ kind: 'asc' }, { startsAt: 'desc' }], // EDITOR before PAID
    take: 5,
    include: {
      property: { include: WITH_HOST },
      reviewer: { select: { name: true } },
    },
  });

  const editor = picks.find((p) => p.kind === 'EDITOR');
  const paid = picks.find((p) => p.kind === 'PAID');
  const chosen = editor ?? paid;

  if (chosen) {
    return {
      property: chosen.property as unknown as Record<string, unknown>,
      kind: chosen.kind === 'PAID' ? 'PAID' : 'EDITOR',
      // A paid placement carries no note, because there is no reviewer.
      note: chosen.kind === 'EDITOR' ? chosen.note : null,
      notePt: chosen.kind === 'EDITOR' ? chosen.notePt : null,
      reviewerName: chosen.kind === 'EDITOR' ? chosen.reviewer?.name ?? null : null,
      endsAt: chosen.endsAt,
    };
  }

  /*
   * Nobody picked one. Fill the slot from the newest listing that clears the
   * bar, and label it honestly — "Newest verified listing", not "Editor's
   * pick". The page must never claim a human chose something nobody chose.
   */
  const candidates = await prisma.property.findMany({
    where: eligibleWhere(),
    orderBy: [{ approvedAt: 'desc' }, { createdAt: 'desc' }],
    take: 25,
    include: WITH_HOST,
  });

  const auto = candidates.find((c) => (c.images?.length ?? 0) >= FALLBACK_MIN_PHOTOS);

  /*
   * Still nothing? Return null and let the caller drop the block. An empty
   * frame where the best property on the site should be is worse than a page
   * that simply does not have that section this week.
   */
  if (!auto) return null;

  return {
    property: auto as unknown as Record<string, unknown>,
    kind: 'AUTO',
    note: null,
    notePt: null,
    reviewerName: null,
    endsAt: null,
  };
}

/**
 * Records an editor's pick. Called from the admin console only.
 *
 * The note arrives from a human typing into a box; nothing here composes,
 * summarises or rewrites it, and there is no code path that could.
 */
export async function setEditorPick(opts: {
  propertyId: string;
  reviewerId: string;
  note: string;
  notePt?: string;
}) {
  const note = opts.note.trim().slice(0, 220);
  if (!note) throw new Error('An editor’s pick without a reason is just a promotion.');

  // One live pick at a time: two would mean the slot silently drops one.
  await prisma.featurePick.deleteMany({
    where: { kind: 'EDITOR', endsAt: { gt: new Date() } },
  });

  return prisma.featurePick.create({
    data: {
      propertyId: opts.propertyId,
      kind: 'EDITOR',
      note,
      notePt: opts.notePt?.trim().slice(0, 220) || null,
      reviewerId: opts.reviewerId,
      endsAt: new Date(Date.now() + PICK_DAYS * 86_400_000),
    },
  });
}

/** Clears expired picks. Run from the daily maintenance sweep. */
export async function sweepFeaturePicks(): Promise<number> {
  const { count } = await prisma.featurePick.deleteMany({
    where: { endsAt: { lt: new Date() } },
  });
  return count;
}
