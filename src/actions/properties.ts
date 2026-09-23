'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { consumeCredit, planForNewListing } from '@/lib/entitlements';
import { buildPropertySlug, uniquePropertySlug } from '@/lib/property-slug';
import { revalidatePath } from 'next/cache';
import { sendPropertyApprovedEmail, sendPropertyRejectedEmail, sendPropertySubmissionNotification, sendPropertySubmittedEmail } from '@/lib/email';

/**
 * Uploads a single image to Cloudinary.
 * Used for sequential uploading from the client to prevent massive payload timeouts.
 */
export async function uploadSingleImage(base64: string, folder: string = 'houseinmozambique/houses') {
  try {
    if (!base64.startsWith('data:')) {
      return { success: false, error: 'Invalid image format. Expected base64 data string.' };
    }
    
    // Import only on server-side execution
    const { uploadImage } = await import('@/lib/cloudinary');
    const url = await uploadImage(base64, folder);
    return { success: true, url };
  } catch (error: any) {
    console.error('Single image upload failed:', error);
    return { success: false, error: error.message || 'Image upload failed.' };
  }
}

/**
 * Creates a property record. 
 * Resolves the hosting agent from the authenticated session cookie.
 */
async function requireAgent() {
  const session = await getSession();

  if (!session) {
    return { error: 'Not authenticated.' };
  }

  const agent = await prisma.agent.findUnique({
    where: { id: session.id },
  });

  if (!agent) {
    return { error: 'Agent not found.' };
  }

  if (agent.role === 'REVOKED') {
    return { error: 'Agent access has been revoked.' };
  }

  return { userId: agent.id };
}

/**
 * Loads a listing and confirms the signed-in agent or private owner owns it.
 * Every self-service listing action goes through here, so one account can never
 * touch another account's portfolio.
 */
async function requireOwnedProperty(id: string) {
  const auth = await requireAgent();
  if ('error' in auth) {
    return { error: auth.error };
  }

  const property = await prisma.property.findUnique({ where: { id } });

  if (!property || property.hostId !== auth.userId) {
    return { error: 'Not authorized to manage this listing.' };
  }

  return { userId: auth.userId, property };
}

function revalidateListing(id: string) {
  revalidatePath('/dashboard/agent');
  revalidatePath('/dashboard/agent/listings');
  revalidatePath('/properties');
  revalidatePath(`/properties/${id}`);
  revalidatePath('/');
}

export async function deleteAgentProperty(id: string) {
  try {
    const owned = await requireOwnedProperty(id);
    if ('error' in owned) {
      return { success: false, error: owned.error };
    }

    await prisma.property.delete({
      where: { id },
    });

    revalidateListing(id);

    return { success: true, property: owned.property };
  } catch (error: any) {
    console.error('Failed to delete agent property:', error);
    return { success: false, error: error.message || 'Delete failed.' };
  }
}

/**
 * Takes a listing off the public site without deleting it. Owners run this
 * themselves — no administrator involvement — and can bring it back later.
 */
export async function suspendAgentProperty(id: string) {
  try {
    const owned = await requireOwnedProperty(id);
    if ('error' in owned) {
      return { success: false, error: owned.error };
    }

    if (owned.property.status === 'SUSPENDED') {
      return { success: true, property: owned.property };
    }

    const property = await prisma.property.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    revalidateListing(id);

    return { success: true, property };
  } catch (error: any) {
    console.error('Failed to suspend agent property:', error);
    return { success: false, error: error.message || 'Suspend failed.' };
  }
}

/**
 * Reverses a suspension. A listing an admin has already approved goes straight
 * back live; one that was never approved returns to the moderation queue.
 */
export async function republishAgentProperty(id: string) {
  try {
    const owned = await requireOwnedProperty(id);
    if ('error' in owned) {
      return { success: false, error: owned.error };
    }

    if (owned.property.status !== 'SUSPENDED') {
      return { success: false, error: 'Only a suspended listing can be reactivated.' };
    }

    /*
     * Bringing a listing back occupies a slot, so it has to pass the same
     * check as creating one.
     *
     * Without this, taking a listing down to free a slot, publishing a new
     * one, and then reactivating the old one is an unlimited free plan — and
     * it is the obvious thing to try, not an exploit anyone would have to
     * look for. The listing is not lost either way; it simply stays down
     * until there is room for it.
     */
    const session = await getSession();
    const decision = await planForNewListing(owned.property.hostId, session?.role);
    if (!decision.ok) {
      return {
        success: false,
        error: decision.reason || 'Your plan has no room for another live listing.',
      };
    }

    const property = await prisma.property.update({
      where: { id },
      data: { status: owned.property.approvedAt ? 'PUBLISHED' : 'PENDING' },
    });

    revalidateListing(id);

    return { success: true, property };
  } catch (error: any) {
    console.error('Failed to republish agent property:', error);
    return { success: false, error: error.message || 'Reactivation failed.' };
  }
}

/**
 * Takes a draft live, once there is room for it.
 *
 * The counterpart to saving one. A draft costs nothing and occupies no slot,
 * so this is where the entitlement is finally checked and attached — the same
 * check createProperty runs, because publishing a draft and publishing a new
 * listing are the same act as far as the quota is concerned.
 */
export async function publishDraft(id: string) {
  try {
    const owned = await requireOwnedProperty(id);
    if ('error' in owned) return { success: false, error: owned.error };

    if (owned.property.status !== 'DRAFT') {
      return { success: false, error: 'That listing is not a draft.' };
    }

    const session = await getSession();
    const isAdmin = session?.role === 'ADMIN';

    const decision = await planForNewListing(owned.property.hostId, session?.role);
    if (!decision.ok) {
      return { success: false, error: decision.reason || 'Your plan has no room for another listing.' };
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        status: isAdmin ? 'PUBLISHED' : 'PENDING',
        ...(isAdmin && { approvedAt: new Date() }),
        subscriptionId: decision.subscriptionId ?? null,
        listingCreditId: decision.listingCreditId ?? null,
        publishedUntil: decision.publishedUntil ?? null,
      },
    });

    if (decision.source === 'credit' && decision.listingCreditId) {
      await consumeCredit(decision.listingCreditId, property.id);
    }

    revalidateListing(id);
    revalidatePath('/dashboard/agent/listings');

    return { success: true, property };
  } catch (error: unknown) {
    console.error('Failed to publish draft:', error);
    const message = error instanceof Error ? error.message : 'Could not publish that draft.';
    return { success: false, error: message };
  }
}

export async function createProperty(formData: any, imageUrls: string[]) {
  try {
    console.log('Finalizing property publication with', imageUrls.length, 'assets');

    // 1. Resolve Agent from the signed session
    const session = await getSession();

    let agent = session
      ? await prisma.agent.findUnique({ where: { id: session.id } })
      : null;

    if (!agent) {
      throw new Error('You must be logged in as an agent to post a property.');
    }

    if (agent.role === 'REVOKED') {
      throw new Error('Agent access has been revoked.');
    }

    // Staff postings are already vetted, so they skip the approval queue.
    const isAdmin = agent.role === 'ADMIN';

    if (!isAdmin && !agent.emailVerifiedAt) {
      throw new Error('Please verify your email address before posting a listing. Check your inbox for the verification link.');
    }

    /*
     * 2. What pays for this listing.
     *
     * Checked here rather than only in the wizard because this action is the
     * single door every client comes through — the web wizard, the mobile app
     * and anything added later. A quota enforced only in the UI is not a quota.
     *
     * Staff skip it. Everyone else gets the free tier created on first use, so
     * accounts that predate plans keep working without a migration.
     */
    /*
     * A draft is not a listing yet, so it is not metered.
     *
     * It is invisible to buyers, occupies no slot and attaches to no
     * entitlement — it is the agent's work in progress, kept safe. The
     * entitlement check runs when they PUBLISH it, which is the moment it
     * actually starts costing something.
     */
    const asDraft = formData.asDraft === true;

    const decision = asDraft
      ? { ok: true as const, source: 'none' as const, subscriptionId: undefined, listingCreditId: undefined, publishedUntil: undefined }
      : await planForNewListing(agent.id, agent.role, {
          /* For the modest-rental exemption: a private owner listing a cheap
             rental is not who the quota is aimed at. Price is stored in major
             units on the form, centavos in the rule. */
          priceMinor: Math.round(Number(formData.price ?? 0) * 100),
          listingType: formData.listingType ?? null,
        });

    if (!decision.ok) {
      throw new Error(('reason' in decision && decision.reason) || 'Your plan does not cover another listing.');
    }

    // 3. Insert into Prisma
    /*
     * The address this listing will be served from, decided before it exists.
     *
     * Built from the same parts the wizard previews, so what the agent was
     * shown under "What search engines will see" is what actually ships.
     */
    const slug = await uniquePropertySlug(
      buildPropertySlug({
        bedrooms: Number(formData.bedrooms ?? 0),
        type: formData.type ?? null,
        listingType: formData.listingType ?? null,
        neighborhood: formData.neighborhood ?? null,
        city: formData.city ?? null,
        title: formData.title ?? null,
      }),
    );

    const property = await prisma.property.create({
      data: {
        slug,
        title: formData.title,
        titlePt: formData.titlePt ?? null,
        description: formData.description,
        descriptionEn: formData.descriptionEn ?? null,
        // Composed alongside the body by the wizard. Null for anything posted
        // through another path, and generateMetadata() falls back there.
        metaEn: formData.metaEn ?? null,
        metaPt: formData.metaPt ?? null,
        // The category answers (condition, furnishing, zoning, DUAT, …). The
        // wizard has been sending these; this is where they are kept.
        details: formData.details ?? undefined,
        // Null rather than 0: (0, 0) is in the Atlantic, and a listing with no
        // pin must show no map rather than a confident wrong one.
        latitude: typeof formData.latitude === 'number' ? formData.latitude : null,
        longitude: typeof formData.longitude === 'number' ? formData.longitude : null,
        location: formData.address || formData.neighborhood || formData.city,
        city: formData.city,
        neighborhood: formData.neighborhood,
        address: formData.address,
        price: parseFloat(formData.price),
        priceUnit: formData.priceUnit,
        type: formData.propertyType,
        listingType: formData.listingType,
        bedrooms: Math.max(0, parseInt(formData.bedrooms?.toString() || '0', 10)),
        bathrooms: Math.max(0, parseInt(formData.bathrooms?.toString() || '0', 10)),
        area: parseFloat(formData.area.toString()) || 0,
        amenities: formData.amenities,
        images: imageUrls,
        tags: formData.tags ?? [],
        hostId: agent.id,
        // Per-listing contact buttons. Null falls back to the agent's own
        // phone and email when the listing page renders them.
        contactWhatsapp: formData.contactWhatsapp ?? null,
        contactPhone: formData.contactPhone ?? null,
        contactEmail: formData.contactEmail ?? null,
        status: asDraft ? 'DRAFT' : isAdmin ? 'PUBLISHED' : 'PENDING',
        ...(isAdmin && !asDraft && { approvedAt: new Date() }),
        // The entitlement that authorised it, recorded on the listing so a plan
        // that later lapses cannot orphan what it legitimately paid for.
        subscriptionId: decision.subscriptionId ?? null,
        listingCreditId: decision.listingCreditId ?? null,
        publishedUntil: decision.publishedUntil ?? null,
        isNew: true,
      },
    });

    // Spending the credit AFTER the property exists: a credit marked consumed
    // against a listing that then failed to save would be money taken for
    // nothing, and there is no user-facing way to get it back.
    if (!asDraft && decision.source === 'credit' && decision.listingCreditId) {
      await consumeCredit(decision.listingCreditId, property.id);
    }

    console.log('Asset published successfully:', property.id);

    revalidatePath('/');
    revalidatePath('/properties');
    revalidatePath('/dashboard/agent');
    revalidatePath('/dashboard/agent/listings');
    revalidatePath('/dashboard/admin/approvals');
    revalidatePath('/dashboard/admin/properties');

    try {
      if (isAdmin) {
        await sendPropertyApprovedEmail(property, { name: agent.name, email: agent.email });
      } else {
        await Promise.all([
          sendPropertySubmissionNotification(property, { name: agent.name, email: agent.email }),
          sendPropertySubmittedEmail(property, { name: agent.name, email: agent.email }),
        ]);
      }
    } catch (error: any) {
      console.error('Property notification email failed:', error);
    }
    
    return { success: true, property };
  } catch (error: any) {
    console.error('Critical failure in publication:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred during publication.' 
    };
  }
}

export async function updateProperty(id: string, formData: any, imageUrls: string[]) {
  try {
    const owned = await requireOwnedProperty(id);
    if ('error' in owned) {
      return { success: false, error: owned.error };
    }

    const { property } = owned;

    // An already-approved listing stays live when its owner edits it, so updates
    // do not need an administrator. Anything not yet approved keeps waiting, and
    // a suspended listing stays suspended until the owner reactivates it.
    const status =
      property.status === 'SUSPENDED'
        ? 'SUSPENDED'
        : property.approvedAt
        ? 'PUBLISHED'
        : 'PENDING';

    /*
     * Remember the old price when it actually moves.
     *
     * A reduction is the strongest buying signal a marketplace holds and the
     * card had no way to show one, because nothing remembered what the listing
     * used to cost. Only recorded when the figure changes: re-saving an
     * unchanged listing must not reset the clock and make a three-month-old
     * cut look like today's news.
     */
    const nextPrice = parseFloat(formData.price);
    const priceMoved =
      Number.isFinite(nextPrice) && Math.abs(nextPrice - property.price) > 0.009;

    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...(priceMoved && { previousPrice: property.price, priceChangedAt: new Date() }),
        title: formData.title,
        description: formData.description,
        location: formData.address || formData.neighborhood || formData.city,
        city: formData.city,
        neighborhood: formData.neighborhood,
        address: formData.address,
        price: nextPrice,
        priceUnit: formData.priceUnit,
        type: formData.propertyType,
        listingType: formData.listingType,
        bedrooms: Math.max(0, parseInt(formData.bedrooms?.toString() || '0', 10)),
        bathrooms: Math.max(0, parseInt(formData.bathrooms?.toString() || '0', 10)),
        area: parseFloat(formData.area.toString()) || 0,
        amenities: formData.amenities,
        images: imageUrls,
        tags: formData.tags ?? [],
        status,
        isNew: true,
      },
    });

    revalidateListing(id);

    return { success: true, property: updated };
  } catch (error: any) {
    console.error('Update property failed:', error);
    return { success: false, error: error.message || 'Failed to update property.' };
  }
}
