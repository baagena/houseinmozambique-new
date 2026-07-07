import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireBearerAdmin } from '@/lib/mobile-auth';
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

export async function GET(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const auth = await requireBearerAdmin(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

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
      authorId: auth.agent.id,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  });

  return NextResponse.json({ success: true, post }, { status: 201 });
}
