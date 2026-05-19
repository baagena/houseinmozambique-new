import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export default async function AdminActivitiesPage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) redirect('/auth');

  const admin = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!admin || admin.role !== 'ADMIN') redirect('/dashboard/agent');

  const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/inquiries/${id}/read`, { method: 'POST', credentials: 'include' });
    // simple reload for now
    location.reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this inquiry?')) return;
    await fetch(`/api/inquiries/${id}/delete`, { method: 'DELETE', credentials: 'include' });
    location.reload();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-black mb-6">System Activities — Inquiries & Leads</h1>
      <div className="space-y-4">
        {inquiries.map((inq) => (
          <div key={inq.id} className="bg-white p-4 rounded-lg border border-[#f2f4f6]">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-[#002045]">{inq.subject}</p>
                <p className="text-sm text-[#74777f]">From: {inq.name} · {inq.email}</p>
                <p className="mt-2 text-[#43474e] whitespace-pre-wrap">{inq.message}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <p className="text-xs text-[#74777f]">{new Date(inq.createdAt).toLocaleString()}</p>
                <div className="flex gap-2">
                  {!inq.isRead && (
                    <button onClick={() => handleMarkRead(inq.id)} className="px-3 py-1 bg-[#845326] text-white rounded">Mark read</button>
                  )}
                  <button onClick={() => handleDelete(inq.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
