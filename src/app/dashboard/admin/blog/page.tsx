import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getAllBlogPostsForAdmin } from '@/lib/blog';
import AdminBlogClient from '@/components/dashboard/AdminBlogClient';
import { getSession } from '@/lib/session';

export default async function AdminBlogPage() {
  const session = await getSession();
  if (!session) redirect('/auth');
  const agentId = session.id;

  const admin = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { role: true },
  });

  if (!admin || admin.role !== 'ADMIN') redirect('/dashboard/agent');

  const posts = await getAllBlogPostsForAdmin();
  const serializedPosts = posts.map((post) => ({
    ...post,
    publishedAt: post.publishedAt?.toISOString() || null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }));

  return <AdminBlogClient posts={serializedPosts} />;
}
