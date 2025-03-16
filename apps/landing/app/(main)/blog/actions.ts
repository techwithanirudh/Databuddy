"use server";

import prisma from "@/lib/db";
import { unstable_cache } from "next/cache";
import { Post, User, Category, Tag } from "@databuddy/db";

// Get all published blog posts
export const getAllPublishedPosts = unstable_cache(
  async () => {
    const posts = await prisma.post.findMany({
      where: { 
        published: true 
      },
      include: {
        author: {
          select: {
            name: true
          }
        },
        category: true,
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform the data to match our expected Post type with categories array
    const transformedPosts = posts.map(post => ({
      ...post,
      categories: post.category ? [post.category] : [],
      author: {
        name: post.author.name || 'Anonymous',
        image: null
      }
    }));
    
    return transformedPosts;
  },
  ["published-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get a single blog post by slug
export const getPostBySlug = unstable_cache(
  async (slug: string) => {
    const post = await prisma.post.findUnique({
      where: { 
        slug,
        published: true
      },
      include: {
        author: {
          select: {
            name: true
          }
        },
        category: true,
        tags: true
      }
    });
    
    if (!post) return null;
    
    // Transform the data to match our expected Post type with categories array
    const transformedPost = {
      ...post,
      categories: post.category ? [post.category] : [],
      author: {
        name: post.author.name || 'Anonymous',
        image: null
      }
    };
    
    return transformedPost;
  },
  ["post-by-slug"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get related posts based on categories and tags
export const getRelatedPosts = unstable_cache(
  async (postId: string, categoryIds: string[], tagIds: string[], limit = 3) => {
    const posts = await prisma.post.findMany({
      where: {
        id: { not: postId },
        published: true,
        OR: [
          { categoryId: { in: categoryIds } },
          { tags: { some: { id: { in: tagIds } } } }
        ]
      },
      include: {
        author: {
          select: {
            name: true
          }
        },
        category: true,
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    // Transform the data to match our expected Post type with categories array
    const transformedPosts = posts.map(post => ({
      ...post,
      categories: post.category ? [post.category] : [],
      author: {
        name: post.author.name || 'Anonymous',
        image: null
      }
    }));
    
    return transformedPosts;
  },
  ["related-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get recent posts
export const getRecentPosts = unstable_cache(
  async (limit = 5) => {
    const posts = await prisma.post.findMany({
      where: { 
        published: true 
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        createdAt: true,
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    // Transform the data to match our expected SidebarPost type
    const transformedPosts = posts.map(post => ({
      ...post,
      coverImage: null, // Add this field to match expected type
      author: {
        name: post.author.name || 'Anonymous',
        image: null
      }
    }));
    
    return transformedPosts;
  },
  ["recent-posts"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get all categories with post count
export const getAllCategories = unstable_cache(
  async () => {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                published: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return categories.map(category => ({
      ...category,
      postCount: category._count.posts
    }));
  },
  ["all-categories"],
  { revalidate: 3600 } // Revalidate every hour
);

// Get all tags with post count
export const getAllTags = unstable_cache(
  async () => {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                published: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return tags.map(tag => ({
      ...tag,
      postCount: tag._count.posts
    }));
  },
  ["all-tags"],
  { revalidate: 3600 } // Revalidate every hour
); 