import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'SUSPENDED', 'INACTIVE']);
export const roleEnum = pgEnum('role', ['ADMIN', 'OWNER', 'EDITOR', 'AUTHOR', 'VIEWER', 'USER']);
export const organizationRoleEnum = pgEnum('organization_role', ['ADMIN', 'OWNER', 'MEMBER', 'VIEWER']);
export const projectStatusEnum = pgEnum('project_status', ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'PAUSED', 'INCOMPLETE']);
export const verificationStatusEnum = pgEnum('verification_status', ['PENDING', 'VERIFIED', 'FAILED']);
export const websiteStatusEnum = pgEnum('website_status', ['ACTIVE', 'HEALTHY', 'UNHEALTHY', 'INACTIVE', 'PENDING']);
export const clientTypeEnum = pgEnum('client_type', ['BROWSER', 'APP', 'API']);

// Tables
export const email = pgTable('emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  ipAddress: varchar('ip_address'),
  email: varchar('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const contact = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull(),
  phone: varchar('phone'),
  company: varchar('company'),
  website: varchar('website'),
  monthlyVisitors: integer('monthly_visitors'),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  repliedAt: timestamp('replied_at'),
  status: varchar('status').default('new').notNull()
});

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').unique().notNull(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  image: varchar('image'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  name: varchar('name'),
  password: varchar('password'),
  status: userStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  role: roleEnum('role').default('USER').notNull(),
  twoFactorEnabled: boolean('two_factor_enabled')
});

export const userRelations = relations(user, ({ many, one }) => ({
  organizations: many(organization, { relationName: 'organizationCreatedBy' }),
  subscriptions: many(subscription, { relationName: 'subscriptionCreatedBy' }),
  memberships: many(member),
  invitesSent: many(member, { relationName: 'invitedBy' }),
  projectAccess: many(projectAccess),
  posts: many(post),
  websites: many(website),
  sessions: many(session),
  accounts: many(account),
  invites: many(invite),
  auditLogs: many(auditLog, { relationName: 'actionByUser' }),
  twofactors: many(twoFactor),
  preferences: one(userPreference)
}));

export const verification = pgTable('verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: varchar('identifier').notNull(),
  value: varchar('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
});

export const session = pgTable('session', {
  id: uuid('id').primaryKey().defaultRandom(),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: varchar('ip_address'),
  userAgent: varchar('user_agent'),
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' })
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id]
  })
}));

// Blog models
export const post = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title').notNull(),
  slug: varchar('slug').unique().notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  published: boolean('published').default(false).notNull(),
  authorId: uuid('author_id').notNull().references(() => user.id),
  coverImage: varchar('cover_image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
  categoryId: uuid('category_id').references(() => category.id),
  deletedAt: timestamp('deleted_at')
});

export const postRelations = relations(post, ({ one, many }) => ({
  author: one(user, {
    fields: [post.authorId],
    references: [user.id]
  }),
  category: one(category, {
    fields: [post.categoryId],
    references: [category.id]
  }),
  tags: many(postToTag)
}));

export const category = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').unique().notNull(),
  slug: varchar('slug').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
});

export const categoryRelations = relations(category, ({ many }) => ({
  posts: many(post)
}));

export const tag = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').unique().notNull(),
  slug: varchar('slug').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
});

export const tagRelations = relations(tag, ({ many }) => ({
  posts: many(postToTag)
}));

// Many-to-many relation between posts and tags
export const postToTag = pgTable('post_to_tag', {
  postId: uuid('post_id').notNull().references(() => post.id),
  tagId: uuid('tag_id').notNull().references(() => tag.id),
});

export const postToTagRelations = relations(postToTag, ({ one }) => ({
  post: one(post, {
    fields: [postToTag.postId],
    references: [post.id]
  }),
  tag: one(tag, {
    fields: [postToTag.tagId],
    references: [tag.id]
  })
}));

// Website models
export const website = pgTable('websites', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: varchar('domain').unique().notNull(),
  name: varchar('name'),
  status: websiteStatusEnum('status').default('ACTIVE').notNull(),
  verificationStatus: verificationStatusEnum('verification_status').default('PENDING').notNull(),
  verificationToken: uuid('verification_token').unique().defaultRandom(),
  verifiedAt: timestamp('verified_at'),
  userId: uuid('user_id').references(() => user.id),
  projectId: uuid('project_id').unique().references(() => project.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
});

export const websiteRelations = relations(website, ({ one }) => ({
  user: one(user, {
    fields: [website.userId],
    references: [user.id]
  }),
  project: one(project, {
    fields: [website.projectId],
    references: [project.id]
  })
}));

// Auth models
export const account = pgTable('account', {
  id: varchar('id').primaryKey(),
  accountId: varchar('account_id').notNull(),
  providerId: varchar('provider_id').notNull(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: varchar('access_token'),
  refreshToken: varchar('refresh_token'),
  idToken: varchar('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: varchar('scope'),
  password: varchar('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id]
  })
}));

// Subscription & Organization models
export const subscription = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: subscriptionStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  trialEndsAt: timestamp('trial_ends_at'),
  organizationId: uuid('organization_id').references(() => organization.id),
  createdById: uuid('created_by_id').references(() => user.id),
  customerId: varchar('customer_id'),
  priceId: varchar('price_id'),
  productId: varchar('product_id'),
  subscriptionId: varchar('subscription_id'),
  plan: varchar('plan'),
  quantity: integer('quantity').default(1)
});

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  organization: one(organization, {
    fields: [subscription.organizationId],
    references: [organization.id]
  }),
  createdBy: one(user, {
    fields: [subscription.createdById],
    references: [user.id],
    relationName: 'subscriptionCreatedBy'
  })
}));

export const organization = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  slug: varchar('slug').unique().notNull(),
  image: varchar('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  createdById: uuid('created_by_id').references(() => user.id),
  plan: varchar('plan').default('free').notNull(),
  subdomain: varchar('subdomain').unique(),
  stripeCustomerId: varchar('stripe_customer_id').unique(),
  domain: varchar('domain').unique()
});

export const organizationRelations = relations(organization, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [organization.createdById],
    references: [user.id],
    relationName: 'organizationCreatedBy'
  }),
  members: many(member),
  subscriptions: many(subscription),
  projects: many(project)
}));

export const member = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  role: organizationRoleEnum('role').default('MEMBER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  userId: uuid('user_id').notNull().references(() => user.id),
  organizationId: uuid('organization_id').notNull().references(() => organization.id),
  invitedById: uuid('invited_by_id').references(() => user.id)
});

export const memberRelations = relations(member, ({ one }) => ({
  user: one(user, {
    fields: [member.userId],
    references: [user.id]
  }),
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id]
  }),
  invitedBy: one(user, {
    fields: [member.invitedById],
    references: [user.id],
    relationName: 'invitedBy'
  })
}));

// Project models
export const projectAccess = pgTable('project_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => project.id),
  userId: uuid('user_id').notNull().references(() => user.id),
  role: roleEnum('role').default('VIEWER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
});

export const projectAccessRelations = relations(projectAccess, ({ one }) => ({
  project: one(project, {
    fields: [projectAccess.projectId],
    references: [project.id]
  }),
  user: one(user, {
    fields: [projectAccess.userId],
    references: [user.id]
  })
}));

export const invite = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull(),
  role: organizationRoleEnum('role').default('MEMBER').notNull(),
  token: varchar('token').unique().notNull(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  organizationId: uuid('organization_id').notNull().references(() => organization.id),
  userId: uuid('user_id').references(() => user.id)
});

export const inviteRelations = relations(invite, ({ one }) => ({
  organization: one(organization, {
    fields: [invite.organizationId],
    references: [organization.id]
  }),
  user: one(user, {
    fields: [invite.userId],
    references: [user.id]
  })
}));

export const project = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  description: text('description'),
  status: projectStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  organizationId: uuid('organization_id').notNull().references(() => organization.id)
});

export const projectRelations = relations(project, ({ one, many }) => ({
  organization: one(organization, {
    fields: [project.organizationId],
    references: [organization.id]
  }),
  access: many(projectAccess),
  website: one(website)
}));

// Event tracking models
export const eventMeta = pgTable('event_meta', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: varchar('event_id').notNull(),
  projectId: uuid('project_id').references(() => project.id),
  clientId: uuid('client_id').references(() => client.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const eventMetaRelations = relations(eventMeta, ({ one }) => ({
  project: one(project, {
    fields: [eventMeta.projectId],
    references: [project.id]
  }),
  client: one(client, {
    fields: [eventMeta.clientId],
    references: [client.id]
  })
}));

// Client models
export const client = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: varchar('client_id').notNull().unique(),
  type: clientTypeEnum('type').default('BROWSER').notNull(),
  browser: varchar('browser'),
  os: varchar('os'),
  device: varchar('device'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  projectId: uuid('project_id').references(() => project.id)
});

export const clientRelations = relations(client, ({ one, many }) => ({
  project: one(project, {
    fields: [client.projectId],
    references: [project.id]
  }),
  events: many(eventMeta)
}));

// Audit models
export const auditLog = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: varchar('action').notNull(),
  entityId: varchar('entity_id'),
  entityType: varchar('entity_type'),
  actorId: uuid('actor_id').references(() => user.id),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  ipAddress: varchar('ip_address'),
  userAgent: varchar('user_agent')
});

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(user, {
    fields: [auditLog.actorId],
    references: [user.id],
    relationName: 'actionByUser'
  })
}));

// Two-factor models
export const twoFactor = pgTable('two_factors', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type').notNull(),
  secret: varchar('secret').notNull(),
  verified: boolean('verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id]
  })
}));

// User preferences
export const userPreference = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  theme: varchar('theme').default('system'),
  enableNotifications: boolean('enable_notifications').default(true),
  dashboardView: varchar('dashboard_view').default('grid'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const userPreferenceRelations = relations(userPreference, ({ one }) => ({
  user: one(user, {
    fields: [userPreference.userId],
    references: [user.id]
  })
})); 