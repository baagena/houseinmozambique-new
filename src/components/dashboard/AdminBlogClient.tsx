'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { formatPostDate, slugify } from '@/lib/blog-utils';
import { uploadSingleImage } from '@/actions/properties';

type AdminBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  status: string;
  isFeatured: boolean;
  readTime: number;
  publishedAt: string | null;
  updatedAt: string;
  author: {
    name: string;
    initials: string;
    title: string;
  } | null;
};

type BlogForm = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string;
  status: 'DRAFT' | 'PUBLISHED';
  isFeatured: boolean;
};

const emptyForm: BlogForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: 'Market Insight',
  tags: '',
  status: 'DRAFT',
  isFeatured: false,
};

function toForm(post: AdminBlogPost): BlogForm {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage || '',
    category: post.category,
    tags: post.tags.join(', '),
    status: post.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    isFeatured: post.isFeatured,
  };
}

function statusClass(status: string) {
  return status === 'PUBLISHED'
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-[#fef9f2] text-[#845326]';
}

export default function AdminBlogClient({ posts }: { posts: AdminBlogPost[] }) {
  const router = useRouter();
  const [form, setForm] = useState<BlogForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    return {
      total: posts.length,
      published: posts.filter((post) => post.status === 'PUBLISHED').length,
      drafts: posts.filter((post) => post.status !== 'PUBLISHED').length,
      featured: posts.filter((post) => post.isFeatured).length,
    };
  }, [posts]);

  const update = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'title' && !current.id ? { slug: slugify(String(value)) } : {}),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setError('');
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Unable to read file as base64.'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const uploadResult = await uploadSingleImage(base64, 'houseinmozambique/blogs');
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload cover image.');
      }

      update('coverImage', (uploadResult as { success: true; url: string }).url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cover image upload failed.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const savePost = async () => {
    setError('');
    setIsSaving(true);
    try {
      const endpoint = form.id ? `/api/admin/blog/${form.id}` : '/api/admin/blog';
      const response = await fetch(endpoint, {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          excerpt: form.excerpt,
          content: form.content,
          coverImage: form.coverImage,
          category: form.category,
          tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          status: form.status,
          isFeatured: form.isFeatured,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to save blog post.');
      }
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save blog post.');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePost = async (post: AdminBlogPost) => {
    if (!window.confirm(`Delete "${post.title}" permanently?`)) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to delete blog post.');
      }
      if (form.id === post.id) resetForm();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to delete blog post.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 rounded-[2rem] border border-[#f2f4f6] bg-white p-8 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#845326]">Editorial Desk</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#002045]" style={{ fontFamily: 'var(--font-headline)' }}>
            Blog Management
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#74777f]">
            Publish market insight, neighborhood guidance, investment notes, and platform announcements for readers browsing House in Mozambique.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Total', stats.total],
            ['Live', stats.published],
            ['Draft', stats.drafts],
            ['Featured', stats.featured],
          ].map(([label, value]) => (
            <div key={label} className="min-w-24 rounded-2xl bg-[#f7f9fb] px-4 py-3 text-center">
              <p className="text-2xl font-black text-[#002045]">{value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#74777f]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[430px_1fr]">
        <section className="space-y-5 rounded-[2rem] border border-[#f2f4f6] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#845326]">
                {form.id ? 'Edit Article' : 'New Article'}
              </p>
              <h2 className="text-xl font-black text-[#002045]">{form.title || 'Untitled draft'}</h2>
            </div>
            {form.id && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-[#f2f4f6] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#74777f]"
              >
                New
              </button>
            )}
          </div>

          <div className="space-y-4">
            <Field label="Title" value={form.title} onChange={(value) => update('title', value)} placeholder="Maputo rental yields in 2026" />
            <Field label="Slug" value={form.slug} onChange={(value) => update('slug', slugify(value))} placeholder="maputo-rental-yields" />
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#74777f]">Cover Image</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#002045] px-4 py-3 text-xs font-black uppercase tracking-widest text-[#febc85] disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">upload_file</span>
                    {isUploadingCover ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleCoverImageUpload} disabled={isUploadingCover} className="sr-only" />
                  </label>
                  <span className="flex items-center text-[10px] font-bold text-[#c4c6cf] uppercase">OR</span>
                </div>
                <input
                  type="text"
                  value={form.coverImage}
                  onChange={(event) => update('coverImage', event.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-[#c4c6cf]/30 bg-[#f7f9fb] px-4 py-3 text-sm font-bold text-[#002045] outline-none focus:border-[#002045]/30"
                />
                {form.coverImage && (
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-[#f2f4f6] bg-[#f7f9fb]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.coverImage} alt="Cover preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" value={form.category} onChange={(value) => update('category', value)} placeholder="Market Insight" />
              <label>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#74777f]">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => update('status', event.target.value as BlogForm['status'])}
                  className="w-full rounded-xl border border-[#c4c6cf]/30 bg-[#f7f9fb] px-4 py-3 text-sm font-bold text-[#002045] outline-none"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </label>
            </div>
            <Field label="Tags" value={form.tags} onChange={(value) => update('tags', value)} placeholder="Maputo, investment, rental" />
            <label>
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#74777f]">Excerpt</span>
              <textarea
                rows={3}
                value={form.excerpt}
                onChange={(event) => update('excerpt', event.target.value)}
                className="w-full rounded-xl border border-[#c4c6cf]/30 bg-[#f7f9fb] px-4 py-3 text-sm font-bold text-[#002045] outline-none"
              />
            </label>
            <label>
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#74777f]">Body</span>
              <textarea
                rows={10}
                value={form.content}
                onChange={(event) => update('content', event.target.value)}
                className="w-full rounded-xl border border-[#c4c6cf]/30 bg-[#f7f9fb] px-4 py-3 text-sm font-bold leading-relaxed text-[#002045] outline-none"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#f2f4f6] bg-[#f7f9fb] p-4">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => update('isFeatured', event.target.checked)}
                className="h-5 w-5 accent-[#002045]"
              />
              <span className="text-sm font-black text-[#002045]">Feature this article</span>
            </label>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

          <button
            type="button"
            onClick={savePost}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#002045] px-5 py-4 text-xs font-black uppercase tracking-widest text-[#fab983] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isSaving ? 'Saving...' : form.id ? 'Save Article' : 'Create Article'}
          </button>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[#f2f4f6] bg-white shadow-sm">
          <div className="border-b border-[#f2f4f6] bg-[#f7f9fb]/60 px-6 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#74777f]">Published and Draft Articles</p>
          </div>
          <div className="divide-y divide-[#f2f4f6]">
            {posts.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-[#c4c6cf]">article</span>
                <p className="mt-3 text-sm font-black uppercase tracking-widest text-[#c4c6cf]">No blog posts yet.</p>
              </div>
            ) : posts.map((post) => (
              <article key={post.id} className="flex flex-col gap-5 px-6 py-5 transition-colors hover:bg-[#f7f9fb] lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${statusClass(post.status)}`}>
                      {post.status}
                    </span>
                    {post.isFeatured && (
                      <span className="rounded-full bg-[#002045] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#fab983]">
                        Featured
                      </span>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#c4c6cf]">{post.category}</span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-[#002045]">{post.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm font-medium leading-relaxed text-[#74777f]">{post.excerpt}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[#845326]">
                    {formatPostDate(post.publishedAt || post.updatedAt)} / {post.readTime} min read
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {post.status === 'PUBLISHED' && (
                    <Link href={`/news/${post.slug}`} className="rounded-xl border border-[#f2f4f6] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#002045]">
                      View
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setForm(toForm(post))}
                    className="rounded-xl bg-[#002045] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePost(post)}
                    className="rounded-xl bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#74777f]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#c4c6cf]/30 bg-[#f7f9fb] px-4 py-3 text-sm font-bold text-[#002045] outline-none"
      />
    </label>
  );
}
