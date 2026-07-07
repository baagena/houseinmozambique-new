import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';
import { estimateReadTime, slugify } from '@/lib/blog-utils';

interface Params {
  params: Promise<{ id: string }>;
}

async function uniqueSlug(title: string, requestedSlug: string | undefined, currentId: string) {
  const base = slugify(requestedSlug || title);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === currentId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const existing = await prisma.blogPost.findUnique({ where: { id }, select: { slug: true, status: true } });
  if (!existing) return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });

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

  return NextResponse.json({ success: true, post });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
