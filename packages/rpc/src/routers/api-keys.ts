import { z } from 'zod/v4';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { apikey } from '@databuddy/db';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { TRPCError } from '@trpc/server';
import { OrganizationAPI } from '@databuddy/auth';

const apiKeyZ = z.object({
    id: z.string(),
    name: z.string(),
    prefix: z.string(),
    start: z.string(),
    key: z.string(),
    userId: z.string().optional(),
    organizationId: z.string().optional(),
    type: z.enum(["user", "sdk", "automation"]),
    scopes: z.array(z.enum([
        "read:data",
        "write:data",
        "read:experiments",
        "track:events",
        "admin:apikeys",
    ])),
    enabled: z.boolean(),
    rateLimitEnabled: z.boolean(),
    rateLimitTimeWindow: z.number().int().optional(),
    rateLimitMax: z.number().int().optional(),
    requestCount: z.number().int(),
    remaining: z.number().int().optional(),
    lastRequest: z.string().optional(),
    lastRefillAt: z.string().optional(),
    refillInterval: z.number().int().optional(),
    refillAmount: z.number().int().optional(),
    expiresAt: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()),
    createdAt: z.string(),
    updatedAt: z.string(),
});

const createApiKeySchema = z.object({
    name: z.string(),
    prefix: z.string().optional().or(z.undefined()),
    start: z.string().optional().or(z.undefined()),
    key: z.string().optional().or(z.undefined()),
    userId: z.string().optional(),
    organizationId: z.string().optional(),
    type: z.enum(["user", "sdk", "automation"]),
    scopes: z.array(z.enum([
        "read:data",
        "write:data",
        "read:experiments",
        "track:events",
        "admin:apikeys",
    ])),
    rateLimitEnabled: z.boolean(),
    rateLimitTimeWindow: z.number().int().optional(),
    rateLimitMax: z.number().int().optional(),
    refillInterval: z.number().int().optional(),
    refillAmount: z.number().int().optional(),
    expiresAt: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()),
});

const updateApiKeySchema = apiKeyZ.partial().extend({
    id: z.string(),
});

export const apiKeysRouter = createTRPCRouter({
    list: protectedProcedure
        .input(z.object({ organizationId: z.string().optional() }).default({}))
        .query(async ({ ctx, input }) => {
            const where = input.organizationId
                ? eq(apikey.organizationId, input.organizationId)
                : eq(apikey.userId, ctx.user.id);
            const keys = await ctx.db.query.apikey.findMany({
                where: and(where, eq(apikey.enabled, true)),
                orderBy: (apikey, { desc }) => [desc(apikey.createdAt)],
            });
            return keys.map(({ key, ...rest }) => rest);
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const key = await ctx.db.query.apikey.findFirst({
                where: eq(apikey.id, input.id),
            });
            if (!key || (!key.userId && !key.organizationId)) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'API key not found' });
            }
            const userOrganizations = await OrganizationAPI.listOrganizations();
            const userOrganizationIds = userOrganizations.data.map(org => org.id);
            if (
                (key.userId && key.userId !== ctx.user.id) &&
                (!key.organizationId || !userOrganizationIds.includes(key.organizationId))
            ) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }
            const { key: _key, ...rest } = key;
            return rest;
        }),

    create: protectedProcedure
        .input(createApiKeySchema)
        .mutation(async ({ ctx, input }) => {
            const now = new Date().toISOString();
            const keyBody = nanoid(48);
            const key = `db_sk_${keyBody}`;
            const prefix = 'db_sk_';
            const start = keyBody.slice(0, 8);
            const keyHash = crypto.createHash('sha256').update(key).digest('hex');
            const [newKey] = await ctx.db
                .insert(apikey)
                .values({
                    name: input.name,
                    prefix,
                    start,
                    key: keyHash,
                    userId: input.organizationId ? undefined : ctx.user.id,
                    organizationId: input.organizationId,
                    type: input.type,
                    scopes: input.scopes,
                    enabled: true,
                    rateLimitEnabled: input.rateLimitEnabled,
                    rateLimitTimeWindow: input.rateLimitTimeWindow,
                    rateLimitMax: input.rateLimitMax,
                    requestCount: 0,
                    remaining: input.rateLimitMax,
                    lastRequest: null,
                    lastRefillAt: null,
                    refillInterval: input.refillInterval,
                    refillAmount: input.refillAmount,
                    expiresAt: input.expiresAt,
                    metadata: input.metadata,
                    createdAt: now,
                    updatedAt: now,
                })
                .returning();
            const { key: _key, ...rest } = newKey;
            return { ...rest, key };
        }),

    update: protectedProcedure
        .input(updateApiKeySchema)
        .mutation(async ({ ctx, input }) => {
            const key = await ctx.db.query.apikey.findFirst({
                where: eq(apikey.id, input.id),
            });
            if (!key) throw new TRPCError({ code: 'NOT_FOUND' });
            const userOrganizations = await OrganizationAPI.listOrganizations();
            const userOrganizationIds = userOrganizations.data.map(org => org.id);
            if (
                (key.userId && key.userId !== ctx.user.id) &&
                (!key.organizationId || !userOrganizationIds.includes(key.organizationId))
            ) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }
            // Only update allowed fields, and use snake_case property names
            const updateFields: Record<string, any> = { ...input };
            delete updateFields.id;
            if (updateFields.userId !== undefined) {
                updateFields.user_id = updateFields.userId;
                delete updateFields.userId;
            }
            if (updateFields.organizationId !== undefined) {
                updateFields.organization_id = updateFields.organizationId;
                delete updateFields.organizationId;
            }
            if (updateFields.rateLimitEnabled !== undefined) {
                updateFields.rate_limit_enabled = updateFields.rateLimitEnabled;
                delete updateFields.rateLimitEnabled;
            }
            if (updateFields.rateLimitTimeWindow !== undefined) {
                updateFields.rate_limit_time_window = updateFields.rateLimitTimeWindow;
                delete updateFields.rateLimitTimeWindow;
            }
            if (updateFields.rateLimitMax !== undefined) {
                updateFields.rate_limit_max = updateFields.rateLimitMax;
                delete updateFields.rateLimitMax;
            }
            if (updateFields.lastRequest !== undefined) {
                updateFields.last_request = updateFields.lastRequest;
                delete updateFields.lastRequest;
            }
            if (updateFields.lastRefillAt !== undefined) {
                updateFields.last_refill_at = updateFields.lastRefillAt;
                delete updateFields.lastRefillAt;
            }
            if (updateFields.refillInterval !== undefined) {
                updateFields.refill_interval = updateFields.refillInterval;
                delete updateFields.refillInterval;
            }
            if (updateFields.refillAmount !== undefined) {
                updateFields.refill_amount = updateFields.refillAmount;
                delete updateFields.refillAmount;
            }
            if (updateFields.expiresAt !== undefined) {
                updateFields.expires_at = updateFields.expiresAt;
                delete updateFields.expiresAt;
            }
            if (updateFields.createdAt !== undefined) {
                updateFields.created_at = updateFields.createdAt;
                delete updateFields.createdAt;
            }
            if (updateFields.updatedAt !== undefined) {
                updateFields.updated_at = updateFields.updatedAt;
                delete updateFields.updatedAt;
            }
            updateFields.updated_at = new Date().toISOString();
            const [updated] = await ctx.db
                .update(apikey)
                .set(updateFields)
                .where(eq(apikey.id, input.id))
                .returning();
            const { key: _key, ...rest } = updated;
            return rest;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const key = await ctx.db.query.apikey.findFirst({
                where: eq(apikey.id, input.id),
            });
            if (!key) throw new TRPCError({ code: 'NOT_FOUND' });
            const userOrganizations = await OrganizationAPI.listOrganizations();
            const userOrganizationIds = userOrganizations.data.map(org => org.id);
            if (!userOrganizationIds.includes(key.organizationId ?? '')) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }
            if (
                (key.userId && key.userId !== ctx.user.id) &&
                (!key.organizationId || !userOrganizationIds.includes(key.organizationId))
            ) {
                throw new TRPCError({ code: 'FORBIDDEN' });
            }
            await ctx.db
                .update(apikey)
                .set({ enabled: false, updated_at: new Date().toISOString() } as any)
                .where(eq(apikey.id, input.id));
            return { success: true };
        }),
}); 