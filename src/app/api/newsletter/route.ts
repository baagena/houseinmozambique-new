import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  CONTACT_EMAIL,
  sendAdminNotificationEmail,
  sendNewsletterConfirmationEmail,
} from '@/lib/email';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const existingSubscription = await prisma.inquiry.findFirst({
      where: {
        email,
        subject: 'Newsletter subscription',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!existingSubscription) {
      await prisma.inquiry.create({
        data: {
          name: 'Newsletter Subscriber',
          email,
          subject: 'Newsletter subscription',
          message: 'Subscribed from the footer Stay Updated form.',
        },
      });
    }

    const safeEmail = escapeHtml(email);

    try {
      await sendAdminNotificationEmail({
        to: CONTACT_EMAIL,
        reply_to: email,
        subject: 'New Newsletter Subscription',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto;">
            <h1 style="color: #002045;">New Newsletter Subscription</h1>
            <p style="color: #43474e;">A visitor subscribed from the footer Stay Updated form.</p>
            <p style="color: #43474e;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
          </div>
        `,
        text: `New Newsletter Subscription

Email: ${email}
Source: Footer Stay Updated form
`,
      });

      await sendNewsletterConfirmationEmail({ email });
    } catch (emailError) {
      console.warn('Newsletter email notification failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      alreadySubscribed: Boolean(existingSubscription),
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Unable to subscribe right now. Please try again shortly.' },
      { status: 500 }
    );
  }
}
