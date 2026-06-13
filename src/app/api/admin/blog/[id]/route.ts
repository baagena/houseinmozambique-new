import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { estimateReadTime, slugify } from '@/lib/blog-utils';

interface Params {
  params: Promise<{ id: string }>;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { error: 'Not authenticated', status: 401 as const };
  }

  const admin = await prisma.agent.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Forbidden - admins only', status: 403 as const };
  }

  return { userId };
}

async function uniqueSlug(title: string, requestedSlug: string | undefined, currentId: string) {
  const base = slugify(requestedSlug || title);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === currentId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function revalidateBlogPaths(oldSlug?: string | null, newSlug?: string | null) {
  revalidatePath('/news');
  revalidatePath('/dashboard/admin/blog');
  if (oldSlug) revalidatePath(`/news/${oldSlug}`);
  if (newSlug && newSlug !== oldSlug) revalidatePath(`/news/${newSlug}`);
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const existing = await prisma.blogPost.findUnique({
      where: { id },
      select: { slug: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
    }

    const body = await request.json();
    const title = String(body.title || '').trim();
    const excerpt = String(body.excerpt || '').trim();
    const content = String(body.content || '').trim();
    const status = body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

    if (!title || !excerpt || !content) {
      return NextResponse.json({ error: 'Title, excerpt, and content are required.' }, { status: 400 });
    }

    const slug = await uniqueSlug(title, body.slug, id);
    const shouldSetPublishedAt = status === 'PUBLISHED' && existing.status !== 'PUBLISHED';

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage: body.coverImage ? String(body.coverImage).trim() : null,
        category: body.category ? String(body.category).trim() : 'Market Insight',
        tags: Array.isArray(body.tags) ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [],
        status,
        isFeatured: Boolean(body.isFeatured),
        readTime: estimateReadTime(content),
        publishedAt: shouldSetPublishedAt ? new Date() : status === 'PUBLISHED' ? undefined : null,
      },
    });

    revalidateBlogPaths(existing.slug, post.slug);
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Admin blog update error:', error);
    return NextResponse.json({ error: 'Failed to update blog post.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const post = await prisma.blogPost.delete({
      where: { id },
      select: { slug: true },
    });

    revalidateBlogPaths(post.slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin blog delete error:', error);
    return NextResponse.json({ error: 'Failed to delete blog post.' }, { status: 500 });
  }
}
