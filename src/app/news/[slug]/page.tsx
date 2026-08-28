import type { Metadata } from 'next';
import SafeImage from '@/components/ui/SafeImage';
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
    <>
      <JsonLd data={jsonLd} />
      <article>
        <header className="page-hero">
          <div className="page-hero__bg">
            <SafeImage
              src={post.coverImage || FALLBACK_IMAGE}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <div className="wrap">
            <Link href="/news" className="eyebrow inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[1rem]">arrow_back</span>
              Blog
            </Link>
            <div className="post-meta" style={{ color: 'rgba(255,255,255,.7)' }}>
              <span className="post-tag">{post.category}</span>
              <span>{formatPostDate(post.publishedAt)}</span>
              <span>·</span>
              <span>{post.readTime} min read</span>
            </div>
            <h1 className="display-l">{post.title}</h1>
            <p>{post.excerpt}</p>
          </div>
        </header>

        <section className="section">
          <div className="wrap">
            <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)_240px]">
              <aside className="hidden lg:block">
                <div className="sticky top-[84px]">
                  <h5 className="mono mb-2 text-[0.68rem] uppercase tracking-[0.1em] text-[var(--hm-muted)]">
                    Author
                  </h5>
                  <p className="font-semibold text-[var(--ink)]">
                    {post.author?.name || 'House in Mozambique'}
                  </p>
                  <p className="mono text-[0.72rem] text-[var(--hm-muted)]">
                    {post.author?.title || 'Editorial desk'}
                  </p>

                  {post.tags.length > 0 && (
                    <>
                      <h5 className="mono mt-7 mb-3 text-[0.68rem] uppercase tracking-[0.1em] text-[var(--hm-muted)]">
                        Tags
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span key={tag} className="type-chip">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </aside>

              <div className="form-card min-w-0">
                <div className="prose-hm">
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <aside>
                <h5 className="mono mb-3 text-[0.68rem] uppercase tracking-[0.1em] text-[var(--hm-muted)]">
                  Related
                </h5>
                {related.length > 0 ? (
                  <div className="space-y-3">
                    {related.map((item) => (
                      <Link
                        key={item.id}
                        href={`/news/${item.slug}`}
                        className="block rounded-[var(--radius-ctrl)] border border-[var(--line)] bg-white p-4 transition-colors hover:border-[var(--gold)]"
                      >
                        <p className="mono text-[0.66rem] uppercase tracking-[0.08em] text-[var(--gold-deep)]">
                          {item.category}
                        </p>
                        <p className="mt-1.5 font-semibold leading-snug text-[var(--ink)]">{item.title}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="muted text-[0.85rem]">
                    More posts coming soon.
                  </p>
                )}
              </aside>
            </div>
          </div>
        </section>
      </article>
    </>
  );
}
