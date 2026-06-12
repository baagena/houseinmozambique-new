import { prisma } from './db';
import { formatPostDate, slugify, estimateReadTime } from './blog-utils';

export { formatPostDate, slugify, estimateReadTime };

export const BLOG_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverImage: true,
  category: true,
  tags: true,
  status: true,
  isFeatured: true,
  readTime: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      name: true,
      initials: true,
      title: true,
    },
  },
} as const;

export async function getPublishedBlogPosts() {
  return prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: BLOG_SELECT,
    orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getBlogPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: BLOG_SELECT,
  });
}

export async function getAllBlogPostsForAdmin() {
  return prisma.blogPost.findMany({
    select: BLOG_SELECT,
    orderBy: { updatedAt: 'desc' },
  });
}
