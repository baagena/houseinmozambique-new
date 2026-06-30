import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatPostDate, getBlogPostBySlug, getPublishedBlogPosts } from '@/lib/blog';
import JsonLd from '@/components/seo/JsonLd';
import { buildMetadata, articleJsonLd, breadcrumbJsonLd } from '@/lib/seo';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1600';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return buildMetadata({ title: 'Article not found', path: `/news/${slug}`, noindex: true });
  }

  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/news/${post.slug}`,
    type: 'article',
    images: post.coverImage ? [post.coverImage] : undefined,
    keywords: post.tags?.length ? post.tags : undefined,
    publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const related = (await getPublishedBlogPosts())
    .filter((item) => item.id !== post.id)
    .slice(0, 3);
  const paragraphs = post.content.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

  const jsonLd = [
    articleJsonLd({
      title: post.title,
      excerpt: post.excerpt,
      slug: post.slug,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      author: post.author,
      category: post.category,
      tags: post.tags,
    }),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/news' },
      { name: post.title, path: `/news/${post.slug}` },
    ]),
  ];

  return (
    <main className="bg-[#f7f9fb]">
      <JsonLd data={jsonLd} />
      <article>
        <header className="relative min-h-[620px] overflow-hidden bg-[#002045] px-6 pt-32 text-white">
          <Image
            src={post.coverImage || FALLBACK_IMAGE}
            alt={post.title}
            fill
            priority
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-[#002045]/60" />
          <div className="relative z-10 mx-auto flex min-h-[560px] max-w-5xl flex-col justify-end pb-16">
            <Link href="/news" className="mb-8 inline-flex w-fit items-center gap-2 text-xs font-black uppercase tracking-widest text-[#fab983]">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Blog
            </Link>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#fab983] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#002045]">
                {post.category}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                {formatPostDate(post.publishedAt)} / {post.readTime} min read
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tight md:text-7xl" style={{ fontFamily: 'var(--font-headline)' }}>
              {post.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-relaxed text-white/80">{post.excerpt}</p>
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[260px_1fr_260px]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#845326]">Author</p>
                <p className="mt-2 text-sm font-black text-[#002045]">{post.author?.name || 'House in Mozambique'}</p>
                <p className="text-xs font-bold text-[#74777f]">{post.author?.title || 'Editorial Desk'}</p>
              </div>
              {post.tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#845326]">Tags</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#74777f]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0 rounded-[2rem] bg-white px-6 py-10 shadow-sm md:px-12">
            <div className="space-y-6 text-lg font-medium leading-8 text-[#43474e]">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#845326]">Related</p>
            {related.length > 0 ? related.map((item) => (
              <Link key={item.id} href={`/news/${item.slug}`} className="block rounded-2xl bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#c4c6cf]">{item.category}</p>
                <h2 className="mt-2 text-sm font-black leading-snug text-[#002045]">{item.title}</h2>
              </Link>
            )) : (
              <p className="rounded-2xl bg-white p-4 text-xs font-bold leading-relaxed text-[#74777f] shadow-sm">
                More posts will appear here as the editorial library grows.
              </p>
            )}
          </aside>
        </section>
      </article>
    </main>
  );
}
