import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { estimateReadTime, slugify } from '@/lib/blog-utils';

async function requireAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { error: 'Not authenticated', status: 401 as const };
  }

  const admin = await prisma.agent.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Forbidden - admins only', status: 403 as const };
  }

  return { userId: admin.id };
}

async function uniqueSlug(title: string, requestedSlug?: string) {
  const base = slugify(requestedSlug || title);
  let candidate = base;
  let suffix = 2;

  while (await prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const title = String(body.title || '').trim();
    const excerpt = String(body.excerpt || '').trim();
    const content = String(body.content || '').trim();
    const status = body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

    if (!title || !excerpt || !content) {
      return NextResponse.json({ error: 'Title, excerpt, and content are required.' }, { status: 400 });
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: await uniqueSlug(title, body.slug),
        excerpt,
        content,
        coverImage: body.coverImage ? String(body.coverImage).trim() : null,
        category: body.category ? String(body.category).trim() : 'Market Insight',
        tags: Array.isArray(body.tags) ? body.tags.map(String).map((tag) => tag.trim()).filter(Boolean) : [],
        status,
        isFeatured: Boolean(body.isFeatured),
        readTime: estimateReadTime(content),
        authorId: auth.userId,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    revalidatePath('/news');
    revalidatePath(`/news/${post.slug}`);
    revalidatePath('/dashboard/admin/blog');

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error('Admin blog create error:', error);
    return NextResponse.json({ error: 'Failed to create blog post.' }, { status: 500 });
  }
}
