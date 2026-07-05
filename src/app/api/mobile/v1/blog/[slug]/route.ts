import { NextResponse } from 'next/server';
import { getBlogPostBySlug, getPublishedBlogPosts } from '@/lib/blog';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const all = await getPublishedBlogPosts();
  const related = all.filter((p) => p.slug !== post.slug).slice(0, 3);

  return NextResponse.json({ post, related });
}
