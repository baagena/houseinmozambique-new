import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions) {
  if (!SENDGRID_API_KEY || !FROM_EMAIL) {
    console.warn('SendGrid not configured. Skipping email send.');
    return null;
  }

  try {
    const msg = {
      to: options.to,
      from: options.from || FROM_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const response = await sgMail.send(msg);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@houseinmozambique.com';
  
  // Send to admin
  await sendEmail({
    to: adminEmail,
    subject: `New Contact Form Submission: ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #002045; border-bottom: 3px solid #845326; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        
        <div style="background-color: #f7f9fb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background-color: white; padding: 15px; border-left: 4px solid #845326;">
            ${data.message}
          </p>
        </div>
        
        <p style="color: #74777f; font-size: 12px; margin-top: 20px;">
          Received from House in Mozambique contact form
        </p>
      </div>
    `,
    text: `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}
    `,
  });

  // Send confirmation to user
  await sendEmail({
    to: data.email,
    subject: 'We Received Your Message - House in Mozambique',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #002045; margin: 0;">House in Mozambique</h1>
          <p style="color: #845326; margin: 5px 0 0 0; font-weight: bold;">Real Estate Excellence</p>
        </div>
        
        <h2 style="color: #002045;">Thank You for Contacting Us!</h2>
        
        <p style="color: #74777f; line-height: 1.6;">
          Dear ${data.name},
        </p>
        
        <p style="color: #74777f; line-height: 1.6;">
          Thank you for reaching out to House in Mozambique. We have received your message and appreciate your interest.
        </p>
        
        <div style="background-color: #f7f9fb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #002045; margin-top: 0;">Your Message Summary:</h3>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background-color: white; padding: 15px; border-left: 4px solid #845326; margin: 10px 0;">
            ${data.message}
          </p>
        </div>
        
        <p style="color: #74777f; line-height: 1.6;">
          Our team will review your inquiry and get back to you as soon as possible. If your matter is urgent, please feel free to call us directly.
        </p>
        
        <div style="background-color: #f2f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #002045; margin-top: 0;">Contact Information</h3>
          <p style="margin: 5px 0;"><strong>Email:</strong> contact@houseinmozambique.com</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> +258 (21) XXX-XXXX</p>
          <p style="margin: 5px 0;"><strong>Website:</strong> www.houseinmozambique.com</p>
        </div>
        
        <p style="color: #74777f; font-size: 12px; margin-top: 20px; border-top: 1px solid #f2f4f6; padding-top: 20px;">
          Best regards,<br>
          The House in Mozambique Team
        </p>
      </div>
    `,
    text: `
Thank you for contacting us!

Dear ${data.name},

Thank you for reaching out to House in Mozambique. We have received your message and appreciate your interest.

Your Message Summary:
Subject: ${data.subject}

Message:
${data.message}

Our team will review your inquiry and get back to you as soon as possible.

Best regards,
The House in Mozambique Team
    `,
  });
}
