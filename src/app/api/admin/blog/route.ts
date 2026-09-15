import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { estimateReadTime, slugify } from '@/lib/blog-utils';


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
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden - admins only' }, { status: 403 });
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
        tags: Array.isArray(body.tags) ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [],
        status,
        isFeatured: Boolean(body.isFeatured),
        readTime: estimateReadTime(content),
        authorId: auth.id,
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
