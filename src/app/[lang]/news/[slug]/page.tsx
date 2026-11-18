import type { Metadata } from 'next';
import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatPostDate, getBlogPostBySlug, getPublishedBlogPosts } from '@/lib/blog';
import { detectTextLang, parseBlogContent } from '@/lib/blog-content';
import JsonLd from '@/components/seo/JsonLd';
import { buildMetadata, articleJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { localizedPath, toSiteLang } from '@/lib/site-lang';
import Icon from '@/components/ui/Icon';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1600';

/* The page's own words, in the language of the address being served. */
const COPY = {
  pt: {
    blog: 'Guias e notícias',
    minRead: 'min de leitura',
    author: 'Autor',
    desk: 'Equipa editorial',
    tags: 'Etiquetas',
    related: 'Mais artigos',
    soon: 'Mais artigos em breve.',
    ctaTitle: 'À procura de um imóvel em Moçambique?',
    ctaText: 'Veja casas, apartamentos e terrenos à venda e para arrendar, com contacto direto com o anunciante.',
    ctaBrowse: 'Ver imóveis',
    ctaRequest: 'Pedir um imóvel',
    home: 'Início',
  },
  en: {
    blog: 'Guides & news',
    minRead: 'min read',
    author: 'Author',
    desk: 'Editorial desk',
    tags: 'Tags',
    related: 'More articles',
    soon: 'More articles coming soon.',
    ctaTitle: 'Looking for property in Mozambique?',
    ctaText: 'Browse houses, apartments and land for sale and rent, and contact the lister directly.',
    ctaBrowse: 'Browse properties',
    ctaRequest: 'Request a property',
    home: 'Home',
  },
} as const;

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

/* Rendered on first visit, then cached; edits purge it (lib/public-cache.ts). */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return buildMetadata({ title: 'Article not found', path: `/news/${slug}`, noindex: true });
  }

  return buildMetadata({
    title: post.title.replace(/[\s,;:]+$/, ''),
    description: post.excerpt,
    path: `/news/${post.slug}`,
    type: 'article',
    images: post.coverImage ? [post.coverImage] : undefined,
    keywords: post.tags?.length ? post.tags : undefined,
    publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    // Each article is written in one language: one canonical address for it.
    onlyLang: detectTextLang(post.title, post.excerpt, post.content),
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { lang: rawLang, slug } = await params;
  const lang = toSiteLang(rawLang);
  const t = COPY[lang];
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const title = post.title.replace(/[\s,;:]+$/, '');
  const postLang = detectTextLang(post.title, post.excerpt, post.content);
  const blocks = parseBlogContent(post.content, post.title);

  // Articles in the reader's language first.
  const related = (await getPublishedBlogPosts())
    .filter((item) => item.id !== post.id)
    .sort((a, b) => Number(detectTextLang(b.title, b.excerpt) === lang) - Number(detectTextLang(a.title, a.excerpt) === lang))
    .slice(0, 3);

  const jsonLd = [
    articleJsonLd({
      title,
      excerpt: post.excerpt,
      slug: post.slug,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      author: post.author,
      category: post.category,
      tags: post.tags,
      lang: postLang,
    }),
    breadcrumbJsonLd([
      { name: COPY[postLang].home, path: localizedPath('/', postLang) },
      { name: COPY[postLang].blog, path: localizedPath('/news', postLang) },
      { name: title, path: localizedPath(`/news/${post.slug}`, postLang) },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <article lang={postLang}>
        <header className="page-hero">
          <div className="page-hero__bg">
            <SafeImage
              src={post.coverImage || FALLBACK_IMAGE}
              alt={title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <div className="wrap">
            <Link href={localizedPath('/news', lang)} className="eyebrow inline-flex items-center gap-1.5" lang={lang}>
              <Icon name="arrow_back" size={16} />
              {t.blog}
            </Link>
            <div className="post-meta" style={{ color: 'rgba(255,255,255,.7)' }} lang={lang}>
              <span className="post-tag">{post.category}</span>
              <time dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>
                {formatPostDate(post.publishedAt)}
              </time>
              <span>·</span>
              <span>
                {post.readTime} {t.minRead}
              </span>
            </div>
            <h1 className="display-l">{title}</h1>
            <p>{post.excerpt}</p>
          </div>
        </header>

        <section className="section">
          <div className="wrap">
            <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)_240px]">
              <aside className="hidden lg:block" lang={lang}>
                <div className="sticky top-[84px]">
                  <h2 className="mono mb-2 text-[0.68rem] uppercase tracking-[0.1em] text-[var(--hm-muted)]">
                    {t.author}
                  </h2>
                  <p className="font-semibold text-[var(--ink)]">
                    {post.author?.name || 'House in Mozambique'}
                  </p>
                  <p className="mono text-[0.72rem] text-[var(--hm-muted)]">
                    {post.author?.title || t.desk}
                  </p>

                  {post.tags.length > 0 && (
                    <>
                      <h2 className="mono mt-7 mb-3 text-[0.68rem] uppercase tracking-[0.1em] text-[var(--hm-muted)]">
                        {t.tags}
                      </h2>
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

              <div className="min-w-0">
                <div className="form-card">
                  <div className="prose-hm blog-body">
                    {blocks.map((block, i) => {
                      switch (block.type) {
                        case 'h2':
                          return <h2 key={i}>{block.text}</h2>;
                        case 'h3':
                          return <h3 key={i}>{block.text}</h3>;
                        case 'ul':
                          return (
                            <ul key={i}>
                              {block.items.map((item, j) => (
                                <li key={j}>{item}</li>
                              ))}
                            </ul>
                          );
                        default:
                          return <p key={i}>{block.text}</p>;
                      }
                    })}
                  </div>
                </div>

                {/* Every guide leads somewhere: readers to listings, and
                    search engines to the pages that matter most. */}
                <div className="form-card mt-6" lang={lang}>
                  <h2 className="text-[1.15rem] font-semibold text-[var(--ink)]">{t.ctaTitle}</h2>
                  <p className="muted mt-2 leading-relaxed">{t.ctaText}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={localizedPath('/properties', lang)} className="btn btn--dark btn--sm">
                      {t.ctaBrowse}
                      <Icon name="arrow_forward" size={18} />
                    </Link>
                    <Link href={localizedPath('/request-property', lang)} className="btn btn--ghost btn--sm">
                      {t.ctaRequest}
                    </Link>
                  </div>
                </div>
              </div>

              <aside lang={lang}>
                <h2 className="mono mb-3 text-[0.68rem] uppercase tracking-[0.1em] text-[var(--hm-muted)]">
                  {t.related}
                </h2>
                {related.length > 0 ? (
                  <div className="space-y-3">
                    {related.map((item) => (
                      <Link
                        key={item.id}
                        href={localizedPath(`/news/${item.slug}`, lang)}
                        className="block rounded-[var(--radius-ctrl)] border border-[var(--line)] bg-white p-4 transition-colors hover:border-[var(--gold)]"
                      >
                        <p className="mono text-[0.66rem] uppercase tracking-[0.08em] text-[var(--gold-deep)]">
                          {item.category}
                        </p>
                        <p className="mt-1.5 font-semibold leading-snug text-[var(--ink)]">
                          {item.title.replace(/[\s,;:]+$/, '')}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="muted text-[0.85rem]">{t.soon}</p>
                )}
              </aside>
            </div>
          </div>
        </section>
      </article>
    </>
  );
}
