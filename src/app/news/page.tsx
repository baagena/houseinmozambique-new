import type { Metadata } from 'next';
import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { getPublishedBlogPosts, formatPostDate } from '@/lib/blog';
import { buildMetadata } from '@/lib/seo';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1600';

export const metadata: Metadata = buildMetadata({
  title: 'Blog — Mozambique Property Market Insight',
  description:
    'Market reports, neighbourhood guides, and investment notes on the Mozambique property market from House in Mozambique.',
  path: '/news',
  keywords: ['Mozambique property market', 'Maputo real estate news', 'Mozambique investment guide'],
});

export default async function NewsPage() {
  const posts = await getPublishedBlogPosts();
  const featured = posts.find((post) => post.isFeatured) || posts[0];
  const remaining = featured ? posts.filter((post) => post.id !== featured.id) : posts;

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__bg">
          <SafeImage
            src={featured?.coverImage || FALLBACK_IMAGE}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="wrap">
          <span className="eyebrow">Market journal</span>
          <h1 className="display-l">Real estate insight for Mozambique.</h1>
          <p>Neighbourhood notes, market reads and practical guidance.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          {featured ? (
            <div className="post-feature">
              <Link href={`/news/${featured.slug}`} className="post-feature__media">
                <SafeImage
                  src={featured.coverImage || FALLBACK_IMAGE}
                  alt={featured.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1000px) 100vw, 55vw"
                />
              </Link>
              <article>
                <div className="post-meta">
                  <span className="post-tag">{featured.category}</span>
                  <span>{formatPostDate(featured.publishedAt)}</span>
                  <span>·</span>
                  <span>{featured.readTime} min</span>
                </div>
                <h2>{featured.title}</h2>
                <p className="muted mt-3 leading-relaxed">{featured.excerpt}</p>
                <Link href={`/news/${featured.slug}`} className="btn btn--dark btn--sm mt-6">
                  Continue reading
                  <span className="material-symbols-outlined text-[1.1rem]">arrow_forward</span>
                </Link>
              </article>
            </div>
          ) : (
            <div className="empty">
              <span className="ico">
                <span className="material-symbols-outlined text-[2.2rem]">article</span>
              </span>
              <h3>Nothing published yet.</h3>
              <p>Posts appear here once the editorial desk sends them live.</p>
            </div>
          )}
        </div>
      </section>

      {remaining.length > 0 && (
        <section className="section pt0">
          <div className="wrap">
            <div className="section-title-row">
              <div>
                <span className="eyebrow">Latest notes</span>
                <h2>Browse the blog</h2>
              </div>
              <span className="mono text-[0.76rem] text-[var(--hm-muted)]">{remaining.length}</span>
            </div>

            <div className="posts">
              {remaining.map((post) => (
                <Link key={post.id} href={`/news/${post.slug}`} className="post">
                  <div className="post__media">
                    <SafeImage
                      src={post.coverImage || FALLBACK_IMAGE}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 33vw"
                    />
                  </div>
                  <div className="post__body">
                    <div className="post-meta">
                      <span className="post-tag">{post.category}</span>
                      <span>{post.readTime} min</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p className="line-clamp-3">{post.excerpt}</p>
                    <p className="mono mt-4 text-[0.7rem] uppercase tracking-[0.08em] text-[var(--hm-muted)]">
                      {formatPostDate(post.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
