
import { Post, Category, Tag, User } from "@databuddy/db";


export type PostWithRelations = Post & {
  categories: Category[];
  tags: Tag[];
  author: User;
};

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