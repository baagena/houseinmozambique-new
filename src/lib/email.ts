import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const NOTIFICATION_FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || RESEND_FROM_EMAIL;
const VERIFY_FROM_EMAIL = process.env.VERIFY_FROM_EMAIL || RESEND_FROM_EMAIL;
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL || 'admin@houseinmozambique.com';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || CONTACT_EMAIL;
export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://houseinmozambique.com';

let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

console.info('Resend config loaded:', {
  hasApiKey: Boolean(RESEND_API_KEY),
  resendFromEmail: RESEND_FROM_EMAIL,
  notificationFromEmail: NOTIFICATION_FROM_EMAIL,
  verifyFromEmail: VERIFY_FROM_EMAIL,
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  reply_to?: string | string[];
}

async function sendEmail(options: EmailOptions) {
  if (!resend) {
    throw new Error('Resend email provider not configured. Set RESEND_API_KEY in your environment.');
  }

  const msg = {
    to: options.to,
    from: options.from || RESEND_FROM_EMAIL,
    subject: options.subject,
    html: options.html,
    text: options.text,
    reply_to: options.reply_to,
  };

  console.info('Resend request:', { to: msg.to, from: msg.from, subject: msg.subject });
  const response = await resend.emails.send(msg as any);
  console.info('Resend response received for:', { to: msg.to, subject: msg.subject });
  return response;
}

export async function sendAdminNotificationEmail(options: EmailOptions) {
  return sendEmail({ ...options, from: options.from || NOTIFICATION_FROM_EMAIL });
}

export async function sendContactNotificationEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  propertyId?: string | null;
  agentName?: string;
  to?: string;
}) {
  const to = data.to || CONTACT_EMAIL;
  const agentName = data.agentName || 'Admin';

  return sendAdminNotificationEmail({
    to,
    from: NOTIFICATION_FROM_EMAIL,
    reply_to: data.email,
    subject: `New Contact Inquiry: ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto;">
        <h1 style="color: #002045;">New Contact Inquiry</h1>
        <p style="color: #43474e;">A new inquiry was submitted by <strong>${data.name}</strong> and assigned to <strong>${agentName}</strong>.</p>
        <ul style="color: #43474e; line-height: 1.8;">
          <li><strong>From:</strong> <a href="mailto:${data.email}">${data.email}</a></li>
          <li><strong>Subject:</strong> ${data.subject}</li>
          ${data.propertyId ? `<li><strong>Property ID:</strong> ${data.propertyId}</li>` : ''}
        </ul>
        <div style="background: #f7f9fb; padding: 20px; border-radius: 12px; margin: 16px 0;">
          <strong>Message:</strong>
          <p style="white-space: pre-wrap;">${data.message}</p>
        </div>
        <p style="color: #74777f;">Please review this inquiry in the admin dashboard or contact the agent directly.</p>
      </div>
    `,
    text: `New Contact Inquiry

From: ${data.name} <${data.email}>
Subject: ${data.subject}
${data.propertyId ? `Property ID: ${data.propertyId}
` : ''}
Assigned to: ${agentName}

Message:
${data.message}
`,
  });
}

export async function sendContactConfirmationEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return sendEmail({
    to: data.email,
    from: NOTIFICATION_FROM_EMAIL,
    subject: 'We received your inquiry - House in Mozambique',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto;">
        <h1 style="color: #002045;">Thanks for contacting House in Mozambique</h1>
        <p style="color: #43474e;">Hi ${data.name},</p>
        <p style="color: #43474e;">We have received your message and an agent will review it shortly.</p>
        <div style="background: #f7f9fb; padding: 20px; border-radius: 12px; margin: 16px 0;">
          <h2 style="color: #002045;">Your Inquiry</h2>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${data.message}</p>
        </div>
        <p style="color: #74777f;">If you need immediate assistance, please reply to this email or call our team.</p>
        <p style="color: #74777f;">Best regards,<br/>House in Mozambique Team</p>
      </div>
    `,
    text: `Thanks for contacting House in Mozambique.

Hi ${data.name},

We have received your message and an agent will review it shortly.

Subject: ${data.subject}

Message:
${data.message}

Best regards,
House in Mozambique Team
`,
  });
}

export async function sendNewsletterConfirmationEmail(data: {
  email: string;
}) {
  return sendEmail({
    to: data.email,
    from: NOTIFICATION_FROM_EMAIL,
    subject: 'You are subscribed - House in Mozambique',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto;">
        <h1 style="color: #002045;">You are on the update list</h1>
        <p style="color: #43474e;">Thanks for subscribing to House in Mozambique updates.</p>
        <p style="color: #43474e;">We will send selected property listings, agent updates, and market insights to this inbox.</p>
        <p style="color: #74777f;">Best regards,<br/>House in Mozambique Team</p>
      </div>
    `,
    text: `You are on the update list

Thanks for subscribing to House in Mozambique updates.

We will send selected property listings, agent updates, and market insights to this inbox.

Best regards,
House in Mozambique Team
`,
  });
}

export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  propertyId?: string | null;
  agentName?: string;
}) {
  await sendContactNotificationEmail({
    ...data,
    agentName: data.agentName,
    to: CONTACT_EMAIL,
  });
  await sendContactConfirmationEmail(data);
}

export async function sendPropertySubmissionNotification(property: {
  id: string;
  title: string;
  listingType: string;
  type: string;
  city: string;
  location: string;
  price: number;
  priceUnit: string;
}, agent: { name: string; email: string; }) {
  return sendAdminNotificationEmail({
    to: ADMIN_EMAIL,
    subject: `New Listing Submitted: ${property.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto;">
        <h1 style="color: #002045;">New Property Submission</h1>
        <p style="color: #43474e;">A new property has been posted by ${agent.name}. Please review and approve in the admin dashboard.</p>
        <ul style="color: #43474e; line-height: 1.8;">
          <li><strong>Title:</strong> ${property.title}</li>
          <li><strong>Type:</strong> ${property.type}</li>
          <li><strong>Listing:</strong> ${property.listingType}</li>
          <li><strong>Location:</strong> ${property.location}, ${property.city}</li>
          <li><strong>Price:</strong> ${property.price.toLocaleString()} ${property.priceUnit}</li>
          <li><strong>Review URL:</strong> <a href="${SITE_URL}/dashboard/admin/approvals">Admin approvals</a></li>
        </ul>
      </div>
    `,
    text: `New Property Submission

Title: ${property.title}
Type: ${property.type}
Listing: ${property.listingType}
Location: ${property.location}, ${property.city}
Price: ${property.price.toLocaleString()} ${property.priceUnit}

Review URL: ${SITE_URL}/dashboard/admin/approvals
`,
  });
}

export async function sendAgentVerificationEmail(agent: {
  name: string;
  email: string;
}) {
  return sendEmail({
    to: agent.email,
    from: VERIFY_FROM_EMAIL,
    subject: 'Verify your House in Mozambique account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto;">
        <h1 style="color: #002045;">Verify Your Agent Registration</h1>
        <p style="color: #43474e;">Hello ${agent.name},</p>
        <p style="color: #43474e;">Thanks for registering as an agent on House in Mozambique.</p>
        <p style="color: #43474e;">This message comes from our verification sender so that we can confirm your account is valid and secure.</p>
        <p style="color: #43474e;">One of our team members will review your profile and approve your account shortly.</p>
        <p style="color: #74777f;">If you did not sign up, please ignore this email.</p>
      </div>
    `,
    text: `Verify Your Agent Registration

Hello ${agent.name},

Thanks for registering as an agent on House in Mozambique.

This message is sent from our verification sender so we can confirm your account is valid.

Our team will review your profile and approve your account shortly.

If you did not sign up, please ignore this email.
`,
  });
}
