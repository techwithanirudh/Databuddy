import { z } from 'zod';
import { Role, UserStatus } from '@databuddy/db';

// User schemas
export const zUserCreate = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(Role).default('USER'),
  status: z.nativeEnum(UserStatus).default('ACTIVE'),
});

export const zUserUpdate = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

// Organization schemas
export const zOrganizationCreate = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  ownerId: z.string().uuid(),
});

export const zOrganizationUpdate = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
});

// Project schemas
export const zProjectCreate = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  organizationId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  type: z.enum(['WEB', 'MOBILE', 'API']).default('WEB'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export const zProjectUpdate = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  clientId: z.string().uuid().optional(),
  type: z.enum(['WEB', 'MOBILE', 'API']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

// Client schemas
export const zClientCreate = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  organizationId: z.string().uuid(),
  type: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']).default('PROSPECT'),
});

export const zClientUpdate = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']).optional(),
});

// Invite schemas
export const zInviteCreate = z.object({
  email: z.string().email(),
  organizationId: z.string().uuid(),
  role: z.nativeEnum(Role),
  expires: z.date().optional().default(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
});

// Member schemas
export const zMemberCreate = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.nativeEnum(Role).default('USER'),
});

export const zMemberUpdate = z.object({
  role: z.nativeEnum(Role),
});

// Blog schemas
export const zPostCreate = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string(),
  excerpt: z.string(),
  published: z.boolean().default(false),
  authorId: z.string().uuid(),
  categoryId: z.string().uuid(),
  tags: z.array(z.string().uuid()),
});

export const zPostUpdate = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  published: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string().uuid()).optional(),
});

export const zCategoryCreate = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
});

export const zCategoryUpdate = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const zTagCreate = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
});

export const zTagUpdate = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
});

// Contact schemas
export const zContactCreate = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  phone: z.string().optional(),
  company: z.string().optional(),
});

// Auth schemas
export const zSignIn = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const zSignUp = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  inviteToken: z.string().optional(),
});

export const zPasswordReset = z.object({
  email: z.string().email(),
});

export const zPasswordUpdate = z.object({
  token: z.string(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Helper types
export type IUserCreate = z.infer<typeof zUserCreate>;
export type IUserUpdate = z.infer<typeof zUserUpdate>;
export type IOrganizationCreate = z.infer<typeof zOrganizationCreate>;
export type IOrganizationUpdate = z.infer<typeof zOrganizationUpdate>;
export type IProjectCreate = z.infer<typeof zProjectCreate>;
export type IProjectUpdate = z.infer<typeof zProjectUpdate>;
export type IClientCreate = z.infer<typeof zClientCreate>;
export type IClientUpdate = z.infer<typeof zClientUpdate>;
export type IInviteCreate = z.infer<typeof zInviteCreate>;
export type IMemberCreate = z.infer<typeof zMemberCreate>;
export type IMemberUpdate = z.infer<typeof zMemberUpdate>;
export type IPostCreate = z.infer<typeof zPostCreate>;
export type IPostUpdate = z.infer<typeof zPostUpdate>;
export type ICategoryCreate = z.infer<typeof zCategoryCreate>;
export type ICategoryUpdate = z.infer<typeof zCategoryUpdate>;
export type ITagCreate = z.infer<typeof zTagCreate>;
export type ITagUpdate = z.infer<typeof zTagUpdate>;
export type IContactCreate = z.infer<typeof zContactCreate>;
export type ISignIn = z.infer<typeof zSignIn>;
export type ISignUp = z.infer<typeof zSignUp>;
export type IPasswordReset = z.infer<typeof zPasswordReset>;
export type IPasswordUpdate = z.infer<typeof zPasswordUpdate>; 