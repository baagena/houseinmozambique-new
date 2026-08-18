import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import InquiriesList from './InquiriesList';

export const dynamic = 'force-dynamic';

export default async function AdminActivitiesPage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) redirect('/auth');

  const admin = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!admin || admin.role !== 'ADMIN') redirect('/dashboard/agent');

  // Newsletter signups live on their own page now, so this stays a pure inbox.
  // The subject filter also hides legacy rows from before subscribers were split out.
  const [inquiries, subscriberCount] = await Promise.all([
    prisma.inquiry.findMany({
      where: { subject: { not: 'Newsletter subscription' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    }),
    prisma.subscriber.count({ where: { isActive: true } }),
  ]);

  const serializedInquiries = inquiries.map((inq) => ({
    ...inq,
    createdAt: inq.createdAt.toISOString(),
    repliedAt: inq.repliedAt?.toISOString() ?? null,
    replies: inq.replies.map((reply) => ({
      id: reply.id,
      subject: reply.subject,
      body: reply.body,
      sentBy: reply.sentBy,
      createdAt: reply.createdAt.toISOString(),
    })),
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#002045] tracking-tight">Contact messages</h1>
          <p className="text-sm text-[#74777f] mt-1">
            Messages and property leads from the website. Answer any of them by email from here.
          </p>
        </div>
        <Link
          href="/dashboard/admin/subscribers"
          className="flex items-center gap-1.5 rounded-lg border border-[#e0e0e0] bg-white px-3.5 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#f5f6f8] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          {subscriberCount} newsletter subscriber(s)
        </Link>
      </div>

      <InquiriesList initialInquiries={serializedInquiries} />
    </div>
  );
}
