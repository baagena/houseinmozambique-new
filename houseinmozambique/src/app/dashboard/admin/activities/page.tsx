import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import InquiriesList from './InquiriesList';

export default async function AdminActivitiesPage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) redirect('/auth');

  const admin = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!admin || admin.role !== 'ADMIN') redirect('/dashboard/agent');

  const inquiries = await prisma.inquiry.findMany({ 
    orderBy: { createdAt: 'desc' }, 
    take: 100 
  });

  // Serialize date fields for Next.js Client Component transmission
  const serializedInquiries = inquiries.map((inq) => ({
    ...inq,
    createdAt: inq.createdAt.toISOString(),
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
          Messages & Newsletter Signups
        </h1>
        <p className="text-sm text-[#74777f] font-medium mt-1">
          Monitor contact messages, property leads, and footer Stay Updated subscriptions.
        </p>
      </div>

      <InquiriesList initialInquiries={serializedInquiries} />
    </div>
  );
}
