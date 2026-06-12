import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendContactConfirmationEmail, sendContactNotificationEmail } from '@/lib/email';

const SECTOR_KEYWORDS: Array<{ specialization: string; keywords: string[] }> = [
  { specialization: 'Luxury Villas', keywords: ['luxury villa', 'luxury villas', 'luxury'] },
  { specialization: 'Expat Relocations', keywords: ['expat', 'relocation', 'relocate', 'relocations'] },
  { specialization: 'Polana District', keywords: ['polana', 'polana district'] },
  { specialization: 'Waterfront Properties', keywords: ['waterfront', 'beachfront', 'sea view'] },
  { specialization: 'Commercial Real Estate', keywords: ['commercial', 'office', 'retail', 'warehouse'] },
  { specialization: 'Beach Resorts', keywords: ['resort', 'beach resort', 'vacation'] },
  { specialization: 'Short-Term Rentals', keywords: ['short-term', 'short term', 'vacation rental', 'holiday rental'] },
  { specialization: 'Investment Properties', keywords: ['investment', 'investor', 'investment property'] },
  { specialization: 'Modern Lofts', keywords: ['loft', 'modern loft', 'industrial loft'] },
];

function inferSpecialization(text: string): string | null {
  const normalized = text.toLowerCase();
  return (
    SECTOR_KEYWORDS.find((entry) =>
      entry.keywords.some((keyword) => normalized.includes(keyword))
    )?.specialization || null
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message, propertyId, agentId } = body;

    console.info('Inquiry API POST received:', {
      name,
      email,
      subject,
      propertyId,
      agentId,
      contactEmail: process.env.CONTACT_EMAIL,
      adminEmail: process.env.ADMIN_EMAIL,
      sendGridConfigured: Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL),
    });

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const contactEmail = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL || 'admin@houseinmozambique.com';

    let assignedAgentId: string | null = agentId || null;
    let agentName = 'Admin';
    let toEmail = contactEmail;

    let specialization: string | null = null;
    let verifiedAgent = null;

    if (agentId) {
      const agent = await prisma.agent.findUnique({ where: { id: agentId } });
      if (agent && agent.email) {
        toEmail = agent.email;
        agentName = agent.name;
      }
    } else {
      specialization = inferSpecialization(`${subject} ${message}`);
      if (specialization) {
        verifiedAgent = await prisma.agent.findFirst({
          where: {
            isVerified: true,
            specializations: { has: specialization },
          },
        });
        if (verifiedAgent && verifiedAgent.email) {
          assignedAgentId = verifiedAgent.id;
          toEmail = verifiedAgent.email;
          agentName = verifiedAgent.name;
        }
      }
    }

    console.info('Inquiry routing:', {
      subject,
      agentId,
      specialization,
      selectedRecipient: toEmail,
      assignedAgentId,
      verifiedAgentEmail: verifiedAgent?.email || null,
      contactEmail,
    });

    // Save inquiry to database
    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        subject,
        message,
        propertyId: propertyId || null,
        agentId: assignedAgentId,
      },
    });

    // Send emails
    try {
      await sendContactNotificationEmail({
        name,
        email,
        subject,
        message,
        propertyId: propertyId || null,
        agentName,
        to: toEmail,
      });

      await sendContactConfirmationEmail({ name, email, subject, message });
    } catch (emailError) {
      console.warn('Email sending failed:', emailError);
      // Don't fail the API if email sending fails
    }

    const isDev = process.env.NODE_ENV === 'development';
    const responsePayload: any = { success: true, inquiry };
    if (isDev) {
      responsePayload.debug = {
        sendGridConfigured: Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL),
        contactEmail: process.env.CONTACT_EMAIL,
        recipient: toEmail,
      };
    }
    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error) {
    console.error('Inquiry API Error:', error);
    return NextResponse.json({ error: 'Failed to process inquiry' }, { status: 500 });
  }
}
