import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail, sendContactFormEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message, propertyId, agentId } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save inquiry to database
    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        subject,
        message,
        propertyId: propertyId || null,
        agentId: agentId || null,
      },
    });

    // Determine recipient
    let toEmail = process.env.ADMIN_EMAIL || 'admin@houseinmozambique.com';
    let agentName = 'Admin';

    if (agentId) {
      const agent = await prisma.agent.findUnique({ where: { id: agentId } });
      if (agent && agent.email) {
        toEmail = agent.email;
        agentName = agent.name;
      }
    }

    // Send emails
    try {
      // Send to admin/agent
      await sendEmail({
        to: toEmail,
        subject: `New Inquiry: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #002045; border-bottom: 3px solid #845326; padding-bottom: 10px;">
              New Inquiry Received
            </h2>
            
            <div style="background-color: #f7f9fb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>From:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Subject:</strong> ${subject}</p>
              ${propertyId ? `<p><strong>Regarding Property ID:</strong> ${propertyId}</p>` : ''}
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap; background-color: white; padding: 15px; border-left: 4px solid #845326;">
                ${message}
              </p>
            </div>
            
            <p style="color: #74777f; font-size: 12px;">
              Please log in to your House in Mozambique dashboard to manage this lead.
            </p>
          </div>
        `,
      });

      // Send confirmation to user
      await sendContactFormEmail({ name, email, subject, message });
    } catch (emailError) {
      console.warn('Email sending failed:', emailError);
      // Don't fail the API if email sending fails
    }

    return NextResponse.json({ success: true, inquiry }, { status: 201 });
  } catch (error) {
    console.error('Inquiry API Error:', error);
    return NextResponse.json({ error: 'Failed to process inquiry' }, { status: 500 });
  }
}
