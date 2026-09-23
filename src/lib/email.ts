import { Resend } from 'resend';
import { prisma } from '@/lib/db';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const NOTIFICATION_FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || RESEND_FROM_EMAIL;
const VERIFY_FROM_EMAIL = process.env.VERIFY_FROM_EMAIL || RESEND_FROM_EMAIL;
const AUTH_FROM_EMAIL = process.env.AUTH_FROM_EMAIL || VERIFY_FROM_EMAIL;
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL || 'admin@houseinmozambique.com';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || CONTACT_EMAIL;
export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://houseinmozambique.com';

let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

console.info(`Resend config loaded: ${JSON.stringify({
  hasApiKey: Boolean(RESEND_API_KEY),
  resendFromEmail: RESEND_FROM_EMAIL,
  notificationFromEmail: NOTIFICATION_FROM_EMAIL,
  authFromEmail: AUTH_FROM_EMAIL,
})}`);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  reply_to?: string | string[];
}

interface ResendSendResult {
  id?: string;
  data?: { id?: string };
  error?: { message?: string } | string | null;
  message?: string;
  name?: string;
  statusCode?: number;
}

function getResendEmailId(response: ResendSendResult) {
  return response.id || response.data?.id;
}

function getResendErrorMessage(response: ResendSendResult) {
  if (typeof response.error === 'string' && response.error.trim()) {
    return response.error;
  }
  if (response.error && typeof response.error === 'object' && response.error.message) {
    return response.error.message;
  }
  if (!getResendEmailId(response) && response.message) {
    return response.message;
  }
  return null;
}

async function sendEmail(options: EmailOptions) {
  if (!resend) {
    throw new Error('Resend email provider not configured. Set RESEND_API_KEY in your environment.');
  }

  const configuredAdminEmail = await prisma.appSetting.findUnique({
    where: { key: 'adminEmail' },
    select: { value: true },
  }).then((setting) => setting?.value.trim() || ADMIN_EMAIL).catch(() => ADMIN_EMAIL);

  const msg = {
    to: options.to === ADMIN_EMAIL || options.to === CONTACT_EMAIL ? configuredAdminEmail : options.to,
    from: options.from || RESEND_FROM_EMAIL,
    subject: options.subject,
    html: options.html,
    text: options.text,
    reply_to: options.reply_to,
  };

  console.info(`Resend request: ${JSON.stringify({ to: msg.to, from: msg.from, subject: msg.subject })}`);
  const response = (await resend.emails.send(msg)) as ResendSendResult;
  const emailId = getResendEmailId(response);
  const errorMessage = getResendErrorMessage(response);

  if (errorMessage || !emailId) {
    console.error(`Resend rejected the email: ${JSON.stringify(response)}`);
    throw new Error(`Resend rejected the email: ${errorMessage || 'no email id returned'}`);
  }

  console.info(`Resend response received for: ${JSON.stringify({ id: emailId, to: msg.to, subject: msg.subject })}`);
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
          <li><strong>Price:</strong> MT ${property.price.toLocaleString()} (${property.priceUnit})</li>
          <li><strong>Review URL:</strong> <a href="${SITE_URL}/dashboard/admin/approvals">Admin approvals</a></li>
        </ul>
      </div>
    `,
    text: `New Property Submission

Title: ${property.title}
Type: ${property.type}
Listing: ${property.listingType}
Location: ${property.location}, ${property.city}
Price: MT ${property.price.toLocaleString()} (${property.priceUnit})

Review URL: ${SITE_URL}/dashboard/admin/approvals
`,
  });
}

export async function sendPropertySubmittedEmail(property: {
  title: string;
  type: string;
  listingType: string;
  city: string;
}, recipient: { name: string; email: string }) {
  return sendEmail({
    to: recipient.email,
    from: NOTIFICATION_FROM_EMAIL,
    subject: `Listing received: ${property.title}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto"><h1 style="color:#002045">Your listing was received</h1><p>Hello ${escapeEmailHtml(recipient.name)},</p><p>We successfully received <strong>${escapeEmailHtml(property.title)}</strong>. It is now waiting for approval by our team.</p><p style="color:#74777f">We will email you again when the listing is approved or rejected.</p></div>`,
    text: `Your listing was received\n\nHello ${recipient.name},\n\nWe successfully received "${property.title}" in ${property.city}. It is now waiting for approval by our team.\n\nWe will email you again when its status changes.`,
  });
}

export async function sendPropertyApprovedEmail(property: { title: string; id: string }, recipient: { name: string; email: string }) {
  return sendEmail({
    to: recipient.email,
    from: NOTIFICATION_FROM_EMAIL,
    subject: `Your listing is live: ${property.title}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto"><h1 style="color:#002045">Your listing is now live</h1><p>Hello ${escapeEmailHtml(recipient.name)},</p><p><strong>${escapeEmailHtml(property.title)}</strong> has been approved and is now visible on House in Mozambique.</p><p><a href="${SITE_URL}/properties/${property.id}">View your live listing</a></p></div>`,
    text: `Your listing is now live\n\nYour listing "${property.title}" has been approved.\n\nView it here: ${SITE_URL}/properties/${property.id}`,
  });
}

export async function sendPropertyRejectedEmail(property: { title: string }, recipient: { name: string; email: string }) {
  return sendEmail({
    to: recipient.email,
    from: NOTIFICATION_FROM_EMAIL,
    subject: `Listing update: ${property.title}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto"><h1 style="color:#002045">Listing update</h1><p>Hello ${escapeEmailHtml(recipient.name)},</p><p>Our team reviewed <strong>${escapeEmailHtml(property.title)}</strong> and it was not approved for publication. Please review the listing details and contact the team if you need help.</p></div>`,
    text: `Listing update\n\nYour listing "${property.title}" was not approved for publication. Please review the details and contact our team if you need help.`,
  });
}

export async function sendAgentVerificationEmail(agent: {
  name: string;
  email: string;
  token?: string;
  /**
   * Where to land them once the link is clicked — normally the page they were
   * trying to reach when they were asked to register. Someone who set out to
   * post a house should finish at the listing form, not at a sign-in box.
   */
  next?: string;
}) {
  const verificationUrl = agent.token
    ? `${SITE_URL}/api/auth/verify?token=${encodeURIComponent(agent.token)}`
      + (agent.next ? `&next=${encodeURIComponent(agent.next)}` : '')
    : SITE_URL;
  return sendEmail({
    to: agent.email,
    from: AUTH_FROM_EMAIL,
    subject: 'Verify your House in Mozambique account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto;">
        <h1 style="color: #002045;">Verify Your Agent Registration</h1>
        <p style="color: #43474e;">Hello ${agent.name},</p>
        <p style="color: #43474e;">Thanks for registering as an agent on House in Mozambique.</p>
        <p style="color: #43474e;">Please confirm your email address so your account is secure.</p>
        <p><a href="${verificationUrl}" style="background:#002045;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;">Confirm and sign in</a></p>
        <p style="color: #43474e;">One of our team members will review your profile and approve your account shortly.</p>
        <p style="color: #74777f;">If you did not sign up, please ignore this email.</p>
      </div>
    `,
    text: `Verify Your Agent Registration

Hello ${agent.name},

Thanks for registering as an agent on House in Mozambique.

Confirm your email address: ${verificationUrl}

This message is sent from our verification sender so we can confirm your account is valid.

Our team will review your profile and approve your account shortly.

If you did not sign up, please ignore this email.
`,
  });
}

export async function sendNewAgentNotificationEmail(agent: {
  name: string;
  email: string;
  role: string;
}) {
  return sendAdminNotificationEmail({
    to: ADMIN_EMAIL,
    subject: `New agent registration: ${agent.name}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto"><h1 style="color:#002045">New agent registration</h1><p><strong>${escapeEmailHtml(agent.name)}</strong> registered on House in Mozambique.</p><p>Email: <a href="mailto:${encodeURIComponent(agent.email)}">${escapeEmailHtml(agent.email)}</a></p><p>Role: ${escapeEmailHtml(agent.role)}</p><p>Please review the account in the admin dashboard.</p></div>`,
    text: `New agent registration\n\nName: ${agent.name}\nEmail: ${agent.email}\nRole: ${agent.role}\n\nPlease review the account in the admin dashboard.`,
  });
}

export async function sendPasswordResetEmail(data: { name: string; email: string; token: string }) {
  const resetUrl = `${SITE_URL}/auth/reset?token=${encodeURIComponent(data.token)}`;
  return sendEmail({
    to: data.email,
    from: AUTH_FROM_EMAIL,
    subject: 'Reset your House in Mozambique password',
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto"><h1 style="color:#002045">Reset your password</h1><p>Hello ${data.name},</p><p>Use the link below within one hour to choose a new password.</p><p><a href="${resetUrl}" style="background:#002045;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px">Create a new password</a></p><p style="color:#74777f">If you did not request this, you can ignore this email.</p></div>`,
    text: `Reset your password\n\nCreate a new password: ${resetUrl}`,
  });
}

export async function sendAgentWelcomeEmail(data: { name: string; email: string }) {
  return sendEmail({
    to: data.email,
    from: AUTH_FROM_EMAIL,
    subject: 'Your House in Mozambique agent account is ready',
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto"><h1 style="color:#002045">Welcome to House in Mozambique</h1><p>Hello ${escapeEmailHtml(data.name)},</p><p>An administrator created your agent account. You can sign in using the email address this message was sent to and the password provided to you by the administrator.</p><p><a href="${SITE_URL}/auth" style="background:#002045;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px">Sign in to your account</a></p><p style="color:#74777f">If you were not expecting this account, please contact our team.</p></div>`,
    text: `Welcome to House in Mozambique\n\nHello ${data.name},\n\nAn administrator created your agent account. Sign in at ${SITE_URL}/auth using the email address this message was sent to and the password provided by the administrator.\n\nIf you were not expecting this account, please contact our team.`,
  });
}

/** Escape user-supplied text before it goes into an HTML email body. */
function escapeEmailHtml(value: string) {
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

/** Turn a plain-text admin reply into safe HTML paragraphs. */
function textToHtmlParagraphs(value: string) {
  return escapeEmailHtml(value)
    .split(/\n{2,}/)
    .map((block) => `<p style="color: #43474e; line-height: 1.7;">${block.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

/**
 * The answer an admin types in the dashboard, delivered to whoever sent the
 * contact message. Replies land back in the team inbox, not the no-reply sender.
 */
export async function sendInquiryReplyEmail(data: {
  to: string;
  name: string;
  subject: string;
  body: string;
  originalMessage: string;
  originalSubject: string;
}) {
  return sendEmail({
    to: data.to,
    from: NOTIFICATION_FROM_EMAIL,
    reply_to: CONTACT_EMAIL,
    subject: data.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto;">
        <h1 style="color: #002045; font-size: 20px;">House in Mozambique</h1>
        <p style="color: #43474e;">Hi ${escapeEmailHtml(data.name)},</p>
        ${textToHtmlParagraphs(data.body)}
        <div style="background: #f7f9fb; padding: 16px 20px; border-radius: 12px; margin: 24px 0; border-left: 3px solid #845326;">
          <p style="color: #74777f; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">
            Your original message
          </p>
          <p style="color: #74777f; font-size: 13px; margin: 0 0 6px;">
            <strong>${escapeEmailHtml(data.originalSubject)}</strong>
          </p>
          <p style="color: #74777f; font-size: 13px; white-space: pre-wrap; margin: 0;">${escapeEmailHtml(data.originalMessage)}</p>
        </div>
        <p style="color: #74777f;">You can reply straight to this email and it will reach our team.</p>
        <p style="color: #74777f;">Best regards,<br/>House in Mozambique Team</p>
      </div>
    `,
    text: `Hi ${data.name},

${data.body}

--- Your original message ---
${data.originalSubject}
${data.originalMessage}

You can reply straight to this email and it will reach our team.

Best regards,
House in Mozambique Team
`,
  });
}

/**
 * One newsletter broadcast, addressed to a single subscriber so recipients never
 * see each other's addresses. Every send carries its own unsubscribe link.
 */
export async function sendSubscriberBroadcastEmail(data: {
  to: string;
  subject: string;
  body: string;
  unsubscribeUrl: string;
}) {
  return sendEmail({
    to: data.to,
    from: NOTIFICATION_FROM_EMAIL,
    reply_to: CONTACT_EMAIL,
    subject: data.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto;">
        <h1 style="color: #002045; font-size: 20px;">House in Mozambique</h1>
        ${textToHtmlParagraphs(data.body)}
        <hr style="border: none; border-top: 1px solid #eceef1; margin: 28px 0 16px;" />
        <p style="color: #9aa0a8; font-size: 12px;">
          You are receiving this because you subscribed to House in Mozambique updates.
          <a href="${data.unsubscribeUrl}" style="color: #845326;">Unsubscribe</a>.
        </p>
      </div>
    `,
    text: `${data.body}

---
You are receiving this because you subscribed to House in Mozambique updates.
Unsubscribe: ${data.unsubscribeUrl}
`,
  });
}

/** MZN in centavos → "3.500,00 MZN". Money in an email must be unambiguous. */
function emailMoney(minor: number, currency: string): string {
  return `${new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100)} ${currency}`;
}

/**
 * A payer has submitted proof of a manual payment — tell the team there is
 * something in the verify queue.
 *
 * Carries the reference and the sending number in the body rather than just a
 * link, because the person checking this is usually looking at an M-Pesa
 * statement on their phone and needs the code to search for, not a round trip
 * through the dashboard.
 */
export async function sendPaymentProofSubmittedEmail(data: {
  orderRef: string;
  planType: string;
  amountMinor: number;
  currency: string;
  payerName: string;
  payerEmail: string;
  payerReference: string | null;
  payerMsisdn: string | null;
  proofUrl: string | null;
  proofNote: string | null;
}) {
  const amount = emailMoney(data.amountMinor, data.currency);
  const verifyUrl = `${SITE_URL}/dashboard/admin/payments/verify`;

  const rows = [
    ['Order reference', data.orderRef],
    ['Plan', data.planType],
    ['Expected', amount],
    ['Payer', `${data.payerName} (${data.payerEmail})`],
    ['Their reference', data.payerReference || '— not given —'],
    ['Sent from', data.payerMsisdn || '— not given —'],
  ];

  return sendEmail({
    to: ADMIN_EMAIL,
    from: NOTIFICATION_FROM_EMAIL,
    reply_to: data.payerEmail,
    subject: `Payment to verify: ${amount} — ${data.orderRef}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
      <h1 style="color:#002045;font-size:20px">A payment is waiting to be verified</h1>
      <p><strong>${escapeEmailHtml(data.payerName)}</strong> says they have sent ${escapeEmailHtml(amount)}.</p>
      <table style="border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:4px 12px 4px 0;color:#74777f">${escapeEmailHtml(label)}</td><td style="padding:4px 0"><strong>${escapeEmailHtml(String(value))}</strong></td></tr>`,
          )
          .join('')}
      </table>
      ${data.proofNote ? `<p style="color:#74777f">Their note: ${escapeEmailHtml(data.proofNote)}</p>` : ''}
      ${data.proofUrl ? `<p><a href="${data.proofUrl}">View the screenshot they attached</a></p>` : '<p style="color:#74777f">No screenshot attached — match the reference against the statement.</p>'}
      <p><a href="${verifyUrl}">Open the verify queue</a></p>
    </div>`,
    text: `A payment is waiting to be verified\n\n${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}\n${data.proofNote ? `\nTheir note: ${data.proofNote}\n` : ''}${data.proofUrl ? `\nScreenshot: ${data.proofUrl}\n` : '\nNo screenshot attached.\n'}\nVerify queue: ${verifyUrl}`,
  });
}

/** Their manual payment was verified and the plan is now active. */
export async function sendPaymentApprovedEmail(data: {
  name: string;
  email: string;
  orderRef: string;
  planType: string;
  amountMinor: number;
  currency: string;
}) {
  const amount = emailMoney(data.amountMinor, data.currency);
  return sendEmail({
    to: data.email,
    from: NOTIFICATION_FROM_EMAIL,
    reply_to: CONTACT_EMAIL,
    subject: `Payment confirmed — ${data.orderRef}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
      <h1 style="color:#002045;font-size:20px">Your payment is confirmed</h1>
      <p>Hello ${escapeEmailHtml(data.name)},</p>
      <p>We matched your payment of <strong>${escapeEmailHtml(amount)}</strong> (reference ${escapeEmailHtml(data.orderRef)}) and your <strong>${escapeEmailHtml(data.planType)}</strong> plan is now active.</p>
      <p><a href="${SITE_URL}/dashboard/agent/billing">See your plan and what it includes</a></p>
    </div>`,
    text: `Your payment is confirmed\n\nHello ${data.name},\n\nWe matched your payment of ${amount} (reference ${data.orderRef}) and your ${data.planType} plan is now active.\n\nSee your plan: ${SITE_URL}/dashboard/agent/billing`,
  });
}

/**
 * The proof did not hold up. Carries the reason, because without it the payer's
 * only remaining move is to send the money a second time.
 */
export async function sendPaymentRejectedEmail(data: {
  name: string;
  email: string;
  orderRef: string;
  reason: string;
}) {
  return sendEmail({
    to: data.email,
    from: NOTIFICATION_FROM_EMAIL,
    reply_to: CONTACT_EMAIL,
    subject: `We could not confirm your payment — ${data.orderRef}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
      <h1 style="color:#002045;font-size:20px">We could not confirm that payment</h1>
      <p>Hello ${escapeEmailHtml(data.name)},</p>
      <p>We checked the proof you sent for reference <strong>${escapeEmailHtml(data.orderRef)}</strong> and could not match it:</p>
      <p style="padding:12px 16px;background:#f7f8f9;border-left:3px solid #845326">${escapeEmailHtml(data.reason)}</p>
      <p><strong>Your money has not been taken</strong> — if you have already sent it, reply to this email and we will trace it. You can also send the proof again from your billing page.</p>
      <p><a href="${SITE_URL}/dashboard/agent/billing">Send the proof again</a></p>
    </div>`,
    text: `We could not confirm that payment\n\nHello ${data.name},\n\nWe checked the proof you sent for reference ${data.orderRef} and could not match it:\n\n${data.reason}\n\nIf you have already sent the money, reply to this email and we will trace it. You can also send the proof again: ${SITE_URL}/dashboard/agent/billing`,
  });
}

/* ── The demand side ────────────────────────────────────────────────────────
 * A buyer's requirement, its receipt, and the fan-out that puts it in front
 * of the agents who pay to receive it.
 */

/** Confirms to the buyer that their requirement landed, and what happens next. */
export async function sendRequestReceivedEmail(data: {
  name: string;
  email: string;
  ref: string;
}) {
  return sendEmail({
    to: data.email,
    from: NOTIFICATION_FROM_EMAIL,
    reply_to: CONTACT_EMAIL,
    subject: `We have your property request — ${data.ref}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
      <h1 style="color:#002045;font-size:20px">We have your request</h1>
      <p>Hello ${escapeEmailHtml(data.name)},</p>
      <p>Your reference is <strong>${escapeEmailHtml(data.ref)}</strong>. We check every request by hand before it goes out, so that agents only receive real enquiries — that usually takes a few hours.</p>
      <p>Once it is released, agents with matching properties will contact you directly. You do not need to do anything else.</p>
      <p style="color:#74777f;font-size:13px">If you would rather withdraw it, reply to this email with your reference.</p>
    </div>`,
    text: `We have your request\n\nHello ${data.name},\n\nYour reference is ${data.ref}. We check every request by hand before it goes out to agents — usually a few hours.\n\nOnce released, agents with matching properties will contact you directly.\n\nTo withdraw it, reply to this email with your reference.`,
  });
}

/** Tells the team there is a requirement waiting to be released. */
export async function sendNewRequestAdminEmail(data: {
  ref: string;
  name: string;
  email: string;
  city: string;
  intent: string;
}) {
  const url = `${SITE_URL}/dashboard/admin/requests`;
  return sendEmail({
    to: ADMIN_EMAIL,
    from: NOTIFICATION_FROM_EMAIL,
    reply_to: data.email,
    subject: `Property request to review: ${data.city} — ${data.ref}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
      <h1 style="color:#002045;font-size:20px">A buyer has posted a requirement</h1>
      <p><strong>${escapeEmailHtml(data.name)}</strong> is looking to <strong>${escapeEmailHtml(data.intent)}</strong> in <strong>${escapeEmailHtml(data.city)}</strong>.</p>
      <p>Reference ${escapeEmailHtml(data.ref)}. It stays hidden from agents until you release it.</p>
      <p><a href="${url}">Open the requests queue</a></p>
    </div>`,
    text: `A buyer has posted a requirement\n\n${data.name} is looking to ${data.intent} in ${data.city}.\nReference ${data.ref}. It stays hidden from agents until you release it.\n\n${url}`,
  });
}

/**
 * Pushes a released requirement to one agent.
 *
 * Sent per agent rather than as one bulk message so each carries the agent's
 * own name and so a bounce is attributable. Callers send these in sequence and
 * swallow individual failures — one dead address must not stop the fan-out.
 */
export async function sendRequestToAgentEmail(data: {
  agentName: string;
  agentEmail: string;
  ref: string;
  intent: string;
  city: string;
  areas: string | null;
  budget: string | null;
  beds: number | null;
  notes: string | null;
}) {
  const url = `${SITE_URL}/dashboard/agent/requests`;
  const rows = [
    ['Looking to', data.intent],
    ['Where', [data.areas, data.city].filter(Boolean).join(', ')],
    ...(data.budget ? [['Budget', data.budget]] : []),
    ...(data.beds ? [['Bedrooms', `${data.beds}+`]] : []),
  ];

  return sendEmail({
    to: data.agentEmail,
    from: NOTIFICATION_FROM_EMAIL,
    reply_to: CONTACT_EMAIL,
    subject: `New buyer looking in ${data.city} — ${data.ref}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
      <h1 style="color:#002045;font-size:20px">A buyer is looking in ${escapeEmailHtml(data.city)}</h1>
      <p>Hello ${escapeEmailHtml(data.agentName)},</p>
      <table style="border-collapse:collapse;font-size:14px;margin:10px 0">
        ${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#74777f">${escapeEmailHtml(k)}</td><td style="padding:4px 0"><strong>${escapeEmailHtml(String(v))}</strong></td></tr>`).join('')}
      </table>
      ${data.notes ? `<p style="color:#43474e">“${escapeEmailHtml(data.notes)}”</p>` : ''}
      <p><a href="${url}" style="background:#002045;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;">See the request and respond</a></p>
      <p style="color:#74777f;font-size:12.5px">You receive these because your plan is active. Reference ${escapeEmailHtml(data.ref)}.</p>
    </div>`,
    text: `A buyer is looking in ${data.city}\n\nHello ${data.agentName},\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n${data.notes ? `\n"${data.notes}"\n` : ''}\nRespond: ${url}\n\nYou receive these because your plan is active. Reference ${data.ref}.`,
  });
}

/** Tells the buyer that an agent has answered. */
export async function sendRequestAnsweredEmail(data: {
  name: string;
  email: string;
  ref: string;
  agentName: string;
  message: string | null;
}) {
  return sendEmail({
    to: data.email,
    from: NOTIFICATION_FROM_EMAIL,
    reply_to: CONTACT_EMAIL,
    subject: `An agent has answered your request — ${data.ref}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
      <h1 style="color:#002045;font-size:20px">An agent has something for you</h1>
      <p>Hello ${escapeEmailHtml(data.name)},</p>
      <p><strong>${escapeEmailHtml(data.agentName)}</strong> has responded to request ${escapeEmailHtml(data.ref)} and will be in touch directly.</p>
      ${data.message ? `<p style="padding:12px 16px;background:#f7f8f9;border-left:3px solid #845326">${escapeEmailHtml(data.message)}</p>` : ''}
      <p><a href="${SITE_URL}/properties">Browse what is listed while you wait</a></p>
    </div>`,
    text: `An agent has something for you\n\nHello ${data.name},\n\n${data.agentName} has responded to request ${data.ref} and will be in touch directly.\n${data.message ? `\n"${data.message}"\n` : ''}`,
  });
}
