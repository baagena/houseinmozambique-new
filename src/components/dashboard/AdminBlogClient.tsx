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
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#002045]">Blog management</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#74777f]">
            Publish market insight, neighborhood guidance, and platform announcements for House in Mozambique.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            ['Total', stats.total],
            ['Live', stats.published],
            ['Draft', stats.drafts],
            ['Featured', stats.featured],
          ].map(([label, value]) => (
            <div key={label} className="min-w-[64px] rounded-lg border border-[#eceef1] bg-white px-3 py-2 text-center">
              <p className="text-lg font-semibold text-[#002045] tabular-nums">{value}</p>
              <p className="text-[11px] font-medium text-[#9aa0a8]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        <section className="space-y-4 rounded-xl border border-[#eceef1] bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#9aa0a8]">
                {form.id ? 'Edit article' : 'New article'}
              </p>
              <h2 className="truncate text-base font-semibold text-[#002045]">{form.title || 'Untitled draft'}</h2>
            </div>
            {form.id && (
              <button
                type="button"
                onClick={resetForm}
                className="shrink-0 rounded-lg border border-[#e3e6ea] px-3 py-1.5 text-[13px] font-medium text-[#5b616b] hover:bg-[#f5f6f8]"
              >
                New
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            <Field label="Title" value={form.title} onChange={(value) => update('title', value)} placeholder="Maputo rental yields in 2026" />
            <Field label="Slug" value={form.slug} onChange={(value) => update('slug', slugify(value))} placeholder="maputo-rental-yields" />
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#5b616b]">Cover image</label>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] hover:bg-[#f5f6f8]">
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    {isUploadingCover ? 'Uploading…' : 'Upload image'}
                    <input type="file" accept="image/*" onChange={handleCoverImageUpload} disabled={isUploadingCover} className="sr-only" />
                  </label>
                  <span className="text-[12px] font-medium text-[#b4b9c0]">or</span>
                </div>
                <input
                  type="text"
                  value={form.coverImage}
                  onChange={(event) => update('coverImage', event.target.value)}
                  placeholder="https://images.unsplash.com/…"
                  className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
                />
                {form.coverImage && (
                  <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-[#eceef1] bg-[#f5f6f8]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.coverImage} alt="Cover preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" value={form.category} onChange={(value) => update('category', value)} placeholder="Market Insight" />
              <label>
                <span className="mb-1 block text-[12px] font-medium text-[#5b616b]">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => update('status', event.target.value as BlogForm['status'])}
                  className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </label>
            </div>
            <Field label="Tags" value={form.tags} onChange={(value) => update('tags', value)} placeholder="Maputo, investment, rental" />
            <label>
              <span className="mb-1 block text-[12px] font-medium text-[#5b616b]">Excerpt</span>
              <textarea
                rows={3}
                value={form.excerpt}
                onChange={(event) => update('excerpt', event.target.value)}
                className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] text-[#43474e] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
              />
            </label>
            <label>
              <span className="mb-1 block text-[12px] font-medium text-[#5b616b]">Body</span>
              <textarea
                rows={10}
                value={form.content}
                onChange={(event) => update('content', event.target.value)}
                className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] leading-relaxed text-[#43474e] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#eceef1] bg-[#fafbfc] px-3 py-2.5">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => update('isFeatured', event.target.checked)}
                className="h-4 w-4 accent-[#002045]"
              />
              <span className="text-[13px] font-medium text-[#002045]">Feature this article</span>
            </label>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600">{error}</p>}

          <button
            type="button"
            onClick={savePost}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#002045] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0a2f5c] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {isSaving ? 'Saving…' : form.id ? 'Save article' : 'Create article'}
          </button>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#eceef1] bg-white">
          <div className="flex items-center border-b border-[#eceef1] bg-[#fafbfc] px-5 h-12">
            <p className="text-sm font-semibold text-[#002045]">Published &amp; draft articles</p>
          </div>
          <div className="divide-y divide-[#f2f4f6]">
            {posts.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-[#e3e6ea]">article</span>
                <p className="mt-2 text-sm text-[#9aa0a8]">No blog posts yet.</p>
              </div>
            ) : posts.map((post) => (
              <article key={post.id} className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[#fafbfc] lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize ${statusClass(post.status)}`}>
                      {post.status.toLowerCase()}
                    </span>
                    {post.isFeatured && (
                      <span className="rounded-md bg-[#002045] px-1.5 py-0.5 text-[11px] font-medium text-[#fab983]">
                        Featured
                      </span>
                    )}
                    <span className="text-[12px] font-medium text-[#9aa0a8]">{post.category}</span>
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-[#002045]">{post.title}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-[#74777f]">{post.excerpt}</p>
                  <p className="mt-1.5 text-[12px] font-medium text-[#9aa0a8]">
                    {formatPostDate(post.publishedAt || post.updatedAt)} · {post.readTime} min read
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[13px] font-medium lg:justify-end">
                  {post.status === 'PUBLISHED' && (
                    <Link href={`/news/${post.slug}`} className="text-[#74777f] hover:text-[#002045]">
                      View
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setForm(toForm(post))}
                    className="text-[#002045] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePost(post)}
                    className="text-red-500 hover:text-red-700"
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
      <span className="mb-1 block text-[12px] font-medium text-[#5b616b]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[13px] font-medium text-[#002045] outline-none focus:border-[#002045]/30 focus:ring-2 focus:ring-[#002045]/10"
      />
    </label>
  );
}
