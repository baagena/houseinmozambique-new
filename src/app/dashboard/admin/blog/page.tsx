import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getAllBlogPostsForAdmin } from '@/lib/blog';
import AdminBlogClient from '@/components/dashboard/AdminBlogClient';

export default async function AdminBlogPage() {
  const cookieStore = await cookies();
  const agentId = cookieStore.get('userId')?.value;

  if (!agentId) redirect('/auth');

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
