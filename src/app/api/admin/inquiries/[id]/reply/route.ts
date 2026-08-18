import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { sendInquiryReplyEmail } from '@/lib/email';
import { requireAdminAgent } from '@/lib/admin-guard';

interface Params {
  params: Promise<{ id: string }>;
}

/** Emails an admin's answer to whoever sent the contact message. */
export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdminAgent();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const payload = await request.json();
  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  const subject =
    typeof payload.subject === 'string' && payload.subject.trim() ? payload.subject.trim() : '';

  if (!body) {
    return NextResponse.json({ error: 'Write a reply before sending.' }, { status: 400 });
  }

  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) {
    return NextResponse.json({ error: 'That message no longer exists.' }, { status: 404 });
  }

  const replySubject = subject || `Re: ${inquiry.subject}`;

  try {
    await sendInquiryReplyEmail({
      to: inquiry.email,
      name: inquiry.name,
      subject: replySubject,
      body,
      originalSubject: inquiry.subject,
      originalMessage: inquiry.message,
    });
  } catch (error: any) {
    console.error('Inquiry reply email failed:', error);
    return NextResponse.json(
      { error: error?.message || 'The reply could not be emailed. Check the email provider settings.' },
      { status: 502 }
    );
  }

  // Only record the reply once the email actually went out.
  const reply = await prisma.inquiryReply.create({
    data: {
      inquiryId: id,
      subject: replySubject,
      body,
      sentBy: admin.name,
      sentTo: inquiry.email,
    },
  });

  await prisma.inquiry.update({
    where: { id },
    data: { isRead: true, repliedAt: reply.createdAt },
  });

  revalidatePath('/dashboard/admin/activities');

  return NextResponse.json({
    success: true,
    reply: { ...reply, createdAt: reply.createdAt.toISOString() },
  });
}
