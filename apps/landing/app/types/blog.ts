// Blog post types
export interface Author {
  id?: string;
  name: string | null;
  image: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  postCount: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
  postCount: number;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage?: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date | null;
  authorId: string;
  categoryId?: string | null;
  author: Author;
  categories: Category[];
  tags: Tag[];
  [key: string]: any; // Allow for additional properties from Prisma
}

// For API responses
export type PostWithRelations = Post;

// For sidebar component
export interface SidebarPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  createdAt: Date | string;
  author: {
    name: string | null;
    image: string | null;
  };
}

export interface SidebarCategory {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export interface SidebarTag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
} 