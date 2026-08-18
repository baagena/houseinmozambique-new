import { NextResponse } from 'next/server';
import {
  CONTACT_EMAIL,
  sendAdminNotificationEmail,
  sendNewsletterConfirmationEmail,
} from '@/lib/email';
import { EMAIL_PATTERN, upsertSubscriber } from '@/lib/subscribers';

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

    // Signups live in their own Subscriber list, not mixed into contact messages.
    const { alreadySubscribed } = await upsertSubscriber(email, 'footer');

    const safeEmail = escapeHtml(email);

    try {
      if (!alreadySubscribed) {
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
      }

      await sendNewsletterConfirmationEmail({ email });
    } catch (emailError) {
      console.warn('Newsletter email notification failed:', emailError);
    }

    return NextResponse.json({ success: true, alreadySubscribed });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Unable to subscribe right now. Please try again shortly.' },
      { status: 500 }
    );
  }
}
