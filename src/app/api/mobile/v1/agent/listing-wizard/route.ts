import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireBearerAgent } from '@/lib/mobile-auth';
import { generateListing } from '@/lib/listing-copy';
import { wizardPropertyFields } from '@/lib/listing-wizard-payload';
import { normalizeAnswers, normalizeContact, wizardBlockers, wizardSchema } from '@/lib/mobile-listing-wizard';
import { buildPropertySlug, uniquePropertySlug } from '@/lib/property-slug';
import { sendPropertyApprovedEmail, sendPropertySubmissionNotification, sendPropertySubmittedEmail } from '@/lib/email';

/** The question set, labels and choices, in ?lang=pt|en. */
export async function GET(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const lang = new URL(request.url).searchParams.get('lang') === 'en' ? 'en' : 'pt';
  return NextResponse.json(wizardSchema(lang));
}

/**
 * Creates a listing from wizard answers.
 *
 * The title, bilingual body and search copy are generated here from the
 * answers — the app sends facts, never prose — and stored with the same
 * fields the web wizard stores. Like the older /agent/properties route it
 * does not meter plans; that stays a separate decision.
 */
export async function POST(request: Request) {
  const auth = await requireBearerAgent(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const agent = auth.agent;

  const body = await request.json().catch(() => ({}));
  const lang = body.lang === 'en' ? 'en' : 'pt';
  const imageUrls: string[] = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u: unknown): u is string => typeof u === 'string' && u.startsWith('http'))
    : [];
  const answers = normalizeAnswers({ ...body.answers, photos: imageUrls.length });

  const blockers = wizardBlockers(answers, lang);
  if (blockers.length) return NextResponse.json({ error: blockers[0], blockers }, { status: 400 });

  try {
    const g = generateListing(answers);
    const fields = wizardPropertyFields(answers, g, normalizeContact(body.contact));
    const isAdmin = agent.role === 'ADMIN';

    const slug = await uniquePropertySlug(
      buildPropertySlug({
        bedrooms: fields.bedrooms,
        type: fields.propertyType,
        listingType: fields.listingType,
        neighborhood: fields.neighborhood,
        city: fields.city,
        title: fields.title,
      }),
    );

    const property = await prisma.property.create({
      data: {
        slug,
        title: fields.title,
        titlePt: fields.titlePt,
        description: fields.description,
        descriptionEn: fields.descriptionEn,
        metaEn: fields.metaEn,
        metaPt: fields.metaPt,
        details: fields.details,
        latitude: fields.latitude,
        longitude: fields.longitude,
        location: fields.address || fields.neighborhood || fields.city,
        city: fields.city,
        neighborhood: fields.neighborhood,
        address: fields.address,
        price: fields.price,
        priceUnit: fields.priceUnit,
        type: fields.propertyType,
        listingType: fields.listingType,
        bedrooms: fields.bedrooms,
        bathrooms: fields.bathrooms,
        area: fields.area,
        amenities: fields.amenities,
        images: imageUrls,
        tags: fields.tags,
        hostId: agent.id,
        contactWhatsapp: fields.contactWhatsapp,
        contactPhone: fields.contactPhone,
        contactEmail: fields.contactEmail,
        status: isAdmin ? 'PUBLISHED' : 'PENDING',
        ...(isAdmin && { approvedAt: new Date() }),
        isNew: true,
      },
    });

    for (const path of ['/', '/properties', '/dashboard/agent', '/dashboard/agent/listings', '/dashboard/admin/approvals', '/dashboard/admin/properties']) {
      revalidatePath(path);
    }

    try {
      const who = { name: agent.name, email: agent.email };
      if (isAdmin) {
        await sendPropertyApprovedEmail(property, who);
      } else {
        await Promise.all([sendPropertySubmissionNotification(property, who), sendPropertySubmittedEmail(property, who)]);
      }
    } catch (error) {
      console.error('Property notification email failed:', error);
    }

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Mobile wizard listing create failed:', error);
    return NextResponse.json({ error: 'Failed to create the listing.' }, { status: 500 });
  }
}
