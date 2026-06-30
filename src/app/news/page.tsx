import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPublishedBlogPosts, formatPostDate } from '@/lib/blog';
import { buildMetadata } from '@/lib/seo';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1600';

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
    <main className="bg-[#f7f9fb]">
      <section className="relative min-h-[560px] overflow-hidden bg-[#002045] px-6 pt-32 text-white">
        <Image
          src={featured?.coverImage || FALLBACK_IMAGE}
          alt={featured?.title || 'Mozambique city skyline'}
          fill
          priority
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-[#002045]/55" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-end pb-16 min-h-[520px]">
          <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-[#fab983]">Market Journal</p>
          <div className="max-w-4xl">
            <h1 className="text-5xl font-black tracking-tight md:text-7xl" style={{ fontFamily: 'var(--font-headline)' }}>
              Real estate insight for Mozambique.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-white/80">
              Neighborhood intelligence, investment notes, platform updates, and practical guidance from the House in Mozambique editorial desk.
            </p>
          </div>
          {featured && (
            <Link href={`/news/${featured.slug}`} className="mt-10 inline-flex w-fit items-center gap-3 rounded-xl bg-[#fab983] px-6 py-4 text-xs font-black uppercase tracking-widest text-[#002045]">
              Read Featured
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        {featured ? (
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <Link href={`/news/${featured.slug}`} className="group block overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={featured.coverImage || FALLBACK_IMAGE}
                  alt={featured.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Link>
            <article>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#845326]/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#845326]">
                  {featured.category}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#74777f]">
                  {formatPostDate(featured.publishedAt)} / {featured.readTime} min read
                </span>
              </div>
              <h2 className="text-4xl font-black tracking-tight text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
                {featured.title}
              </h2>
              <p className="mt-5 text-base font-medium leading-relaxed text-[#43474e]">{featured.excerpt}</p>
              <Link href={`/news/${featured.slug}`} className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#002045]">
                Continue Reading
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </article>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[#f2f4f6] bg-white px-8 py-20 text-center shadow-sm">
            <span className="material-symbols-outlined text-6xl text-[#c4c6cf]">article</span>
            <h2 className="mt-5 text-3xl font-black text-[#002045]">The journal is being prepared.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-[#74777f]">
              Published blog posts will appear here once the admin editorial desk sends them live.
            </p>
          </div>
        )}

        {remaining.length > 0 && (
          <div className="mt-16">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#845326]">Latest Notes</p>
                <h2 className="mt-2 text-3xl font-black text-[#002045]">Browse the blog</h2>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {remaining.map((post) => (
                <Link key={post.id} href={`/news/${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#002045]/10">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#e6e8ea]">
                    <Image
                      src={post.coverImage || FALLBACK_IMAGE}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <article className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#f7f9fb] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#845326]">
                        {post.category}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#c4c6cf]">{post.readTime} min</span>
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-[#002045]">{post.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm font-medium leading-relaxed text-[#74777f]">{post.excerpt}</p>
                    <span className="mt-auto pt-6 text-[10px] font-black uppercase tracking-widest text-[#002045]">
                      {formatPostDate(post.publishedAt)}
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
