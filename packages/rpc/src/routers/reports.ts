import { reportExecutions, reportTemplates } from '@databuddy/db';
import { createDrizzleCache, redis } from '@databuddy/redis';
import { TRPCError } from '@trpc/server';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { and, desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { reportScheduler } from '../../../../apps/api/src/services/report-scheduler';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { authorizeWebsiteAccess } from '../utils/auth';

dayjs.extend(utc);

const drizzleCache = createDrizzleCache({ redis, namespace: 'reports' });
const CACHE_TTL = 300;

const reportSectionSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1).max(200),
	queryType: z.string().min(1),
	chartType: z.enum(['line', 'bar', 'pie', 'metric']).optional(),
	filters: z.array(z.record(z.string(), z.unknown())).optional().default([]),
	timeRange: z.object({
		start: z.string().datetime(),
		end: z.string().datetime(),
	}),
	includeComparison: z.boolean().default(false),
});

const reportCustomizationSchema = z.object({
	logo: z.string().url().optional(),
	colors: z
		.object({
			primary: z
				.string()
				.regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
			secondary: z
				.string()
				.regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
		})
		.optional(),
	branding: z
		.object({
			companyName: z.string().min(1).max(100),
			website: z.string().url().optional(),
		})
		.optional(),
});

const createReportTemplateSchema = z.object({
	websiteId: z.string().optional(),
	organizationId: z.string().optional(),
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	type: z.enum(['executive', 'detailed', 'performance', 'traffic', 'custom']),
	sections: z.array(reportSectionSchema).min(1),
	customization: reportCustomizationSchema.optional(),
	isPublic: z.boolean().default(false),
	isMarketplace: z.boolean().default(false),
	scheduleType: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
	scheduleDay: z.number().min(1).max(31).optional(),
	scheduleTime: z.string().default('09:00:00'),
	timezone: z.string().default('UTC'),
	recipients: z
		.array(
			z.object({
				email: z.string().email(),
				name: z.string().min(1).max(100),
			})
		)
		.max(50, 'Maximum 50 recipients allowed')
		.optional(),
});

const updateReportTemplateSchema = createReportTemplateSchema.partial().extend({
	id: z.string(),
});

export const reportsRouter = createTRPCRouter({
	list: protectedProcedure
		.input(
			z.object({
				websiteId: z.string().optional(),
				organizationId: z.string().optional(),
			})
		)
		.query(({ ctx, input }) => {
			const cacheKey = `reports:list:${input.websiteId || 'all'}:${input.organizationId || 'none'}`;

			return drizzleCache.withCache({
				key: cacheKey,
				ttl: CACHE_TTL,
				tables: ['report_templates'],
				queryFn: async () => {
					const conditions = [eq(reportTemplates.userId, ctx.user.id)];

					if (input.websiteId) {
						await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
						conditions.push(eq(reportTemplates.websiteId, input.websiteId));
					}

					if (input.organizationId) {
						conditions.push(
							eq(reportTemplates.organizationId, input.organizationId)
						);
					}

					return ctx.db
						.select()
						.from(reportTemplates)
						.where(and(...conditions))
						.orderBy(desc(reportTemplates.createdAt));
				},
			});
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(({ ctx, input }) => {
			const cacheKey = `reports:byId:${input.id}`;

			return drizzleCache.withCache({
				key: cacheKey,
				ttl: CACHE_TTL,
				tables: ['report_templates'],
				queryFn: async () => {
					const template = await ctx.db
						.select()
						.from(reportTemplates)
						.where(eq(reportTemplates.id, input.id))
						.limit(1);

					if (template.length === 0) {
						throw new TRPCError({
							code: 'NOT_FOUND',
							message: 'Report template not found',
						});
					}

					const result = template[0];

					if (!result.isPublic && result.userId !== ctx.user.id) {
						if (result.websiteId) {
							await authorizeWebsiteAccess(ctx, result.websiteId, 'read');
						} else {
							throw new TRPCError({
								code: 'FORBIDDEN',
								message: 'Not authorized to access this template',
							});
						}
					}

					return result;
				},
			});
		}),

	create: protectedProcedure
		.input(createReportTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			if (input.websiteId) {
				await authorizeWebsiteAccess(ctx, input.websiteId, 'update');
			}

			const templateId = nanoid();
			const now = dayjs.utc().toISOString();

			const [newTemplate] = await ctx.db
				.insert(reportTemplates)
				.values({
					id: templateId,
					websiteId: input.websiteId || null,
					organizationId: input.organizationId || null,
					userId: ctx.user.id,
					name: input.name,
					description: input.description,
					type: input.type,
					sections: input.sections,
					customization: input.customization || null,
					isPublic: input.isPublic,
					isMarketplace: input.isMarketplace,
					scheduleType: input.scheduleType || null,
					scheduleDay: input.scheduleDay || null,
					scheduleTime: input.scheduleTime,
					timezone: input.timezone,
					recipients: input.recipients || null,
					enabled: true,
					createdAt: now,
					updatedAt: now,
				})
				.returning();

			if (newTemplate.enabled) {
				await reportScheduler.scheduleReport(newTemplate);
			}

			await drizzleCache.invalidateByTables(['report_templates']);
			return newTemplate;
		}),

	update: protectedProcedure
		.input(updateReportTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			const existingTemplate = await ctx.db
				.select()
				.from(reportTemplates)
				.where(eq(reportTemplates.id, input.id))
				.limit(1);

			if (existingTemplate.length === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Report template not found',
				});
			}

			const template = existingTemplate[0];

			if (template.userId !== ctx.user.id) {
				if (template.websiteId) {
					await authorizeWebsiteAccess(ctx, template.websiteId, 'update');
				} else {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'Not authorized to update this template',
					});
				}
			}

			const { id, ...updates } = input;
			const now = dayjs.utc().toISOString();

			const [updatedTemplate] = await ctx.db
				.update(reportTemplates)
				.set({
					...updates,
					updatedAt: now,
				})
				.where(eq(reportTemplates.id, id))
				.returning();

			if (updatedTemplate.enabled) {
				await reportScheduler.scheduleReport(updatedTemplate);
			} else {
				await reportScheduler.unscheduleReport(id);
			}

			await Promise.all([
				drizzleCache.invalidateByTables(['report_templates']),
				drizzleCache.invalidateByKey(`reports:byId:${id}`),
			]);

			return updatedTemplate;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existingTemplate = await ctx.db
				.select()
				.from(reportTemplates)
				.where(eq(reportTemplates.id, input.id))
				.limit(1);

			if (existingTemplate.length === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Report template not found',
				});
			}

			const template = existingTemplate[0];

			if (template.userId !== ctx.user.id) {
				if (template.websiteId) {
					await authorizeWebsiteAccess(ctx, template.websiteId, 'delete');
				} else {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'Not authorized to delete this template',
					});
				}
			}

			await ctx.db
				.delete(reportTemplates)
				.where(eq(reportTemplates.id, input.id));

			await reportScheduler.unscheduleReport(input.id);

			await Promise.all([
				drizzleCache.invalidateByTables(['report_templates']),
				drizzleCache.invalidateByKey(`reports:byId:${input.id}`),
			]);

			return { success: true };
		}),

	toggle: protectedProcedure
		.input(z.object({ id: z.string(), enabled: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const existingTemplate = await ctx.db
				.select()
				.from(reportTemplates)
				.where(eq(reportTemplates.id, input.id))
				.limit(1);

			if (existingTemplate.length === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Report template not found',
				});
			}

			const template = existingTemplate[0];

			if (template.userId !== ctx.user.id && template.websiteId) {
				await authorizeWebsiteAccess(ctx, template.websiteId, 'update');
			}

			const [updatedTemplate] = await ctx.db
				.update(reportTemplates)
				.set({
					enabled: input.enabled,
					updatedAt: dayjs.utc().toISOString(),
				})
				.where(eq(reportTemplates.id, input.id))
				.returning();

			if (updatedTemplate.enabled) {
				await reportScheduler.scheduleReport(updatedTemplate);
			} else {
				await reportScheduler.unscheduleReport(input.id);
			}

			await Promise.all([
				drizzleCache.invalidateByTables(['report_templates']),
				drizzleCache.invalidateByKey(`reports:byId:${input.id}`),
			]);

			return updatedTemplate;
		}),

	executions: protectedProcedure
		.input(
			z.object({
				templateId: z.string().optional(),
				websiteId: z.string().optional(),
				limit: z.number().min(1).max(100).default(20),
			})
		)
		.query(({ ctx, input }) => {
			const cacheKey = `reports:executions:${input.templateId || 'all'}:${input.websiteId || 'all'}:${input.limit}`;

			return drizzleCache.withCache({
				key: cacheKey,
				ttl: CACHE_TTL,
				tables: ['report_executions'],
				queryFn: async () => {
					const conditions: ReturnType<typeof eq>[] = [];

					if (input.templateId) {
						conditions.push(eq(reportExecutions.templateId, input.templateId));
					}

					if (input.websiteId) {
						await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
						conditions.push(eq(reportExecutions.websiteId, input.websiteId));
					}

					return ctx.db
						.select()
						.from(reportExecutions)
						.where(conditions.length > 0 ? and(...conditions) : undefined)
						.orderBy(desc(reportExecutions.executedAt))
						.limit(input.limit);
				},
			});
		}),

	marketplace: protectedProcedure
		.input(
			z.object({
				type: z
					.enum(['executive', 'detailed', 'performance', 'traffic', 'custom'])
					.optional(),
				limit: z.number().min(1).max(50).default(20),
			})
		)
		.query(({ ctx, input }) => {
			const cacheKey = `reports:marketplace:${input.type || 'all'}:${input.limit}`;

			return drizzleCache.withCache({
				key: cacheKey,
				ttl: CACHE_TTL * 2,
				tables: ['report_templates'],
				queryFn: () => {
					const conditions = [
						eq(reportTemplates.isMarketplace, true),
						eq(reportTemplates.isPublic, true),
					];

					if (input.type) {
						conditions.push(eq(reportTemplates.type, input.type));
					}

					return ctx.db
						.select({
							id: reportTemplates.id,
							name: reportTemplates.name,
							description: reportTemplates.description,
							type: reportTemplates.type,
							downloads: reportTemplates.downloads,
							rating: reportTemplates.rating,
							createdAt: reportTemplates.createdAt,
						})
						.from(reportTemplates)
						.where(and(...conditions))
						.orderBy(
							desc(reportTemplates.downloads),
							desc(reportTemplates.rating)
						)
						.limit(input.limit);
				},
			});
		}),

	clone: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				websiteId: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const template = await ctx.db
				.select()
				.from(reportTemplates)
				.where(eq(reportTemplates.id, input.id))
				.limit(1);

			if (template.length === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Template not found',
				});
			}

			const original = template[0];

			if (!original.isPublic && original.userId !== ctx.user.id) {
				if (original.websiteId) {
					await authorizeWebsiteAccess(ctx, original.websiteId, 'read');
				} else {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'Not authorized to clone this template',
					});
				}
			}

			if (original.isPublic && original.websiteId) {
				await authorizeWebsiteAccess(ctx, original.websiteId, 'read');
			}

			if (input.websiteId) {
				await authorizeWebsiteAccess(ctx, input.websiteId, 'update');
			}

			const cloneId = nanoid();
			const now = dayjs.utc().toISOString();

			if (original.isMarketplace) {
				await ctx.db
					.update(reportTemplates)
					.set({ downloads: (original.downloads || 0) + 1 })
					.where(eq(reportTemplates.id, input.id));
			}

			const [clonedTemplate] = await ctx.db
				.insert(reportTemplates)
				.values({
					id: cloneId,
					websiteId: input.websiteId || null,
					userId: ctx.user.id,
					organizationId: null,
					name: `${original.name} (Copy)`,
					description: original.description,
					type: original.type,
					sections: original.sections,
					customization: original.customization,
					isPublic: false,
					isMarketplace: false,
					enabled: false,
					createdAt: now,
					updatedAt: now,
				})
				.returning();

			await drizzleCache.invalidateByTables(['report_templates']);
			return clonedTemplate;
		}),
});
