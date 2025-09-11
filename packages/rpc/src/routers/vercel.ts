import { account } from '@databuddy/db';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { VercelSDK } from '../lib/vercel-sdk';
import {
	buildWebsiteFilter,
	domainSchema,
	WebsiteService,
	websiteNameSchema,
} from '../services/website-service';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const buildDomainIntegrationStatus = (
	domain: any,
	databeddyEnvVars: any[],
	websiteMap: Map<string, any>,
	domainMap: Map<string, any>
) => {
	const domainName = domain.name;

	// Helper function to find matching website by domain (handles www subdomain variations)
	const findMatchingWebsite = (targetDomain: string) => {
		// First try exact match
		if (domainMap.has(targetDomain)) {
			return domainMap.get(targetDomain);
		}

		// Try without www prefix
		const withoutWww = targetDomain.replace(/^www\./, '');
		if (domainMap.has(withoutWww)) {
			return domainMap.get(withoutWww);
		}

		// Try with www prefix
		const withWww = `www.${targetDomain}`;
		if (domainMap.has(withWww)) {
			return domainMap.get(withWww);
		}

		return null;
	};
	const domainStatus = {
		domain: domainName,
		isIntegrated: false,
		websiteId: null as string | null,
		websiteName: null as string | null,
		environments: [] as string[],
		envVarId: null as string | null,
		status: 'not_integrated' as
			| 'integrated'
			| 'not_integrated'
			| 'orphaned'
			| 'invalid',
		issues: [] as string[],
	};

	// Filter env vars relevant to this domain
	const relevantEnvVars = databeddyEnvVars.filter((envVar) => {
		if (!envVar.target?.length) {
			return true;
		}

		const isProductionDomain = domain.verified;
		const hasProductionTarget = envVar.target.includes('production');
		const hasPreviewTarget = envVar.target.includes('preview');

		return isProductionDomain
			? hasProductionTarget
			: hasPreviewTarget || hasProductionTarget;
	});

	if (relevantEnvVars.length) {
		const envVar = relevantEnvVars[0];
		const websiteId = envVar.value;
		const website = websiteMap.get(websiteId);
		const domainWebsite = findMatchingWebsite(domainName);

		Object.assign(domainStatus, {
			websiteId,
			envVarId: envVar.id,
			environments: envVar.target || [],
		});

		if (website) {
			Object.assign(domainStatus, {
				isIntegrated: true,
				websiteName: website.name,
				status: 'integrated',
			});

			// Check for domain mismatch (allow www subdomain variations)
			const websiteDomainMatches =
				website.domain === domainName ||
				website.domain === domainName.replace(/^www\./, '') ||
				website.domain === `www.${domainName}` ||
				domainName === `www.${website.domain}`;

			if (!websiteDomainMatches) {
				domainStatus.issues.push(
					`Domain mismatch: env var points to website "${website.domain}"`
				);
				domainStatus.status = 'invalid';
			}

			if (domainWebsite && domainWebsite.id !== websiteId) {
				domainStatus.issues.push(
					`Conflicting website: domain has website "${domainWebsite.name}" but env var points to "${website.name}"`
				);
				domainStatus.status = 'invalid';
			}
		} else {
			domainStatus.status = 'orphaned';
			domainStatus.issues.push(
				`Environment variable points to non-existent website ID: ${websiteId}`
			);
		}

		if (relevantEnvVars.length > 1) {
			domainStatus.issues.push(
				`Multiple NEXT_PUBLIC_DATABUDDY_CLIENT_ID variables found (${relevantEnvVars.length})`
			);
			domainStatus.status = 'invalid';
		}

		if (!envVar.target?.length) {
			domainStatus.issues.push(
				'Environment variable has no target environments'
			);
			domainStatus.status = 'invalid';
		}
	} else {
		// Check if website exists (with subdomain variations)
		const domainWebsite = findMatchingWebsite(domainName);
		if (domainWebsite) {
			// Website exists but no environment variable - show as partially integrated
			Object.assign(domainStatus, {
				websiteId: domainWebsite.id,
				websiteName: domainWebsite.name,
				isIntegrated: false, // Not fully integrated since no env var
				status: 'invalid',
			});
			domainStatus.issues.push(
				'Website exists but no matching environment variable found'
			);
		}
	}

	return domainStatus;
};

const buildIntegrationSummary = (integrationStatus: any[]) => ({
	totalDomains: integrationStatus.length,
	integratedCount: integrationStatus.filter((d) => d.status === 'integrated')
		.length,
	notIntegratedCount: integrationStatus.filter(
		(d) => d.status === 'not_integrated'
	).length,
	orphanedCount: integrationStatus.filter((d) => d.status === 'orphaned')
		.length,
	invalidCount: integrationStatus.filter((d) => d.status === 'invalid').length,
	issuesCount: integrationStatus.reduce((sum, d) => sum + d.issues.length, 0),
});

const getVercelToken = async (userId: string, db: any): Promise<string> => {
	const vercelAccount = await db.query.account.findFirst({
		where: and(eq(account.providerId, 'vercel'), eq(account.userId, userId)),
		columns: { accessToken: true },
	});

	if (!vercelAccount?.accessToken) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message:
				'No Vercel account found. Please connect your Vercel account first.',
		});
	}

	return vercelAccount.accessToken;
};

const getProjectsSchema = z.object({
	limit: z.string().optional(),
	since: z.number().optional(),
	until: z.number().optional(),
	includeIntegrationStatus: z.boolean().optional().default(true),
	organizationId: z.string().optional(),
});

const getProjectEnvsSchema = z.object({
	projectId: z.string(),
});

const createProjectEnvSchema = z.object({
	projectId: z.string(),
	key: z.string(),
	value: z.string(),
	type: z
		.enum(['system', 'secret', 'encrypted', 'plain', 'sensitive'])
		.default('plain'),
	target: z.array(z.enum(['production', 'preview', 'development'])).optional(),
	gitBranch: z.string().nullable().optional(),
	comment: z.string().optional(),
	customEnvironmentIds: z.array(z.string()).optional(),
	upsert: z.boolean().optional(),
	teamId: z.string().optional(),
	slug: z.string().optional(),
});

const createProjectEnvBatchSchema = z.object({
	projectId: z.string(),
	envVars: z.array(
		z.object({
			key: z.string(),
			value: z.string(),
			type: z
				.enum(['system', 'secret', 'encrypted', 'plain', 'sensitive'])
				.default('plain'),
			target: z
				.array(z.enum(['production', 'preview', 'development']))
				.optional(),
			gitBranch: z.string().nullable().optional(),
			comment: z.string().optional(),
			customEnvironmentIds: z.array(z.string()).optional(),
		})
	),
	upsert: z.boolean().optional(),
	teamId: z.string().optional(),
	slug: z.string().optional(),
});

const getProjectDomainsSchema = z.object({
	projectId: z.string(),
	production: z.string().optional(),
	target: z.string().optional(),
	customEnvironmentId: z.string().optional(),
	gitBranch: z.string().optional(),
	redirects: z.string().optional(),
	redirect: z.string().optional(),
	verified: z.string().optional(),
	limit: z.number().optional(),
	since: z.number().optional(),
	until: z.number().optional(),
	order: z.string().optional(),
});

const getProjectEnvByKeySchema = z.object({
	projectId: z.string(),
	key: z.string(),
	teamId: z.string().optional(),
	slug: z.string().optional(),
});

const setProjectEnvSchema = z.object({
	projectId: z.string(),
	key: z.string(),
	value: z.string(),
	type: z
		.enum(['system', 'secret', 'encrypted', 'plain', 'sensitive'])
		.optional(),
	target: z.array(z.enum(['production', 'preview', 'development'])).optional(),
	gitBranch: z.string().nullable().optional(),
	comment: z.string().optional(),
	upsert: z.boolean().optional(),
	teamId: z.string().optional(),
	slug: z.string().optional(),
});

const deleteProjectEnvByKeySchema = z.object({
	projectId: z.string(),
	key: z.string(),
	teamId: z.string().optional(),
	slug: z.string().optional(),
});

const editProjectEnvSchema = z.object({
	projectId: z.string(),
	envVarId: z.string(),
	key: z.string().optional(),
	value: z.string().optional(),
	type: z
		.enum(['system', 'secret', 'encrypted', 'plain', 'sensitive'])
		.optional(),
	target: z.array(z.enum(['production', 'preview', 'development'])).optional(),
	gitBranch: z.string().nullable().optional(),
	comment: z.string().optional(),
	customEnvironmentIds: z.array(z.string()).optional(),
	teamId: z.string().optional(),
	slug: z.string().optional(),
});

const removeProjectEnvSchema = z.object({
	projectId: z.string(),
	envVarId: z.string(),
	customEnvironmentId: z.string().optional(),
	teamId: z.string().optional(),
	slug: z.string().optional(),
});

const integrateWebsitesSchema = z.object({
	projectId: z.string(),
	websites: z.array(
		z.object({
			domainName: domainSchema,
			websiteName: websiteNameSchema,
			target: z.array(z.enum(['production', 'preview', 'development'])),
			// Optional domain metadata for reference
			domainId: z.string().optional(),
			verified: z.boolean().optional(),
			gitBranch: z.string().nullable().optional(),
		})
	),
	organizationId: z.string().optional(),
	teamId: z.string().optional(),
	slug: z.string().optional(),
});

const checkIntegrationStatusSchema = z.object({
	projectId: z.string(),
	domains: z.array(z.string()).optional(), // Optional: check specific domains
	organizationId: z.string().optional(),
	teamId: z.string().optional(),
	slug: z.string().optional(),
});

const triageIssueSchema = z.object({
	projectId: z.string(),
	action: z.enum([
		'remove_orphaned',
		'fix_domain_mismatch',
		'remove_duplicates',
		'create_missing_website',
	]),
	domainName: z.string(),
	envVarId: z.string().optional(),
	websiteId: z.string().optional(),
	organizationId: z.string().optional(),
	teamId: z.string().optional(),
	slug: z.string().optional(),
});

export const vercelRouter = createTRPCRouter({
	getProjects: protectedProcedure
		.input(getProjectsSchema.default({}))
		.query(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			const projectsData = await vercel.getProjects({
				...(input.limit && { limit: input.limit }),
				...(input.since && { since: input.since }),
				...(input.until && { until: input.until }),
			});

			if (!(input.includeIntegrationStatus && projectsData.projects?.length)) {
				return projectsData;
			}

			// Fetch integration status for all projects
			const userWebsites = await ctx.db.query.websites.findMany({
				where: buildWebsiteFilter(ctx.user.id, input.organizationId),
			});

			const websiteMap = new Map(userWebsites.map((w) => [w.id, w]));
			const domainMap = new Map(userWebsites.map((w) => [w.domain, w]));

			// Process each project to add integration status
			const projectsWithStatus = await Promise.all(
				projectsData.projects.map(async (project) => {
					try {
						const [databeddyEnvVars, projectDomains] = await Promise.all([
							vercel.getProjectEnvsByKey(
								project.id,
								'NEXT_PUBLIC_DATABUDDY_CLIENT_ID',
								{}
							),
							vercel.getProjectDomains(project.id, {}),
						]);

						const integrationStatus = projectDomains.domains.map((domain) =>
							buildDomainIntegrationStatus(
								domain,
								databeddyEnvVars,
								websiteMap,
								domainMap
							)
						);

						const summary = buildIntegrationSummary(integrationStatus);

						return {
							id: project.id,
							name: project.name,
							accountId: project.accountId,
							createdAt: project.createdAt,
							updatedAt: project.updatedAt,
							framework: project.framework,
							live: project.live,
							link: project.link,
							primaryDomain: project.primaryDomain,
							integrationStatus: {
								integrationStatus,
								summary,
								totalEnvVars: databeddyEnvVars.length,
								projectDomains: projectDomains.domains.map((d) => ({
									name: d.name,
									verified: d.verified,
								})),
							},
						};
					} catch (error: any) {
						return {
							id: project.id,
							name: project.name,
							accountId: project.accountId,
							createdAt: project.createdAt,
							updatedAt: project.updatedAt,
							framework: project.framework,
							live: project.live,
							link: project.link,
							primaryDomain: project.primaryDomain,
							integrationStatus: null,
						};
					}
				})
			);

			return {
				projects: projectsWithStatus,
				pagination: projectsData.pagination,
			};
		}),

	getProjectEnvs: protectedProcedure
		.input(getProjectEnvsSchema)
		.query(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			return await vercel.getProjectEnvs(input.projectId);
		}),

	createProjectEnv: protectedProcedure
		.input(createProjectEnvSchema)
		.mutation(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			const { projectId, upsert, teamId, slug, ...rest } = input;

			const envVar = {
				key: rest.key,
				value: rest.value,
				type: rest.type,
				...(rest.target && { target: rest.target }),
				...(rest.gitBranch !== undefined && { gitBranch: rest.gitBranch }),
				...(rest.comment && { comment: rest.comment }),
				...(rest.customEnvironmentIds && {
					customEnvironmentIds: rest.customEnvironmentIds,
				}),
			};

			return await vercel.createProjectEnv(projectId, envVar, {
				...(upsert !== undefined && { upsert }),
				...(teamId && { teamId }),
				...(slug && { slug }),
			});
		}),

	createProjectEnvBatch: protectedProcedure
		.input(createProjectEnvBatchSchema)
		.mutation(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			const { projectId, envVars, upsert, teamId, slug } = input;

			const processedEnvVars = envVars.map((envVar) => ({
				key: envVar.key,
				value: envVar.value,
				type: envVar.type,
				...(envVar.target && { target: envVar.target }),
				...(envVar.gitBranch !== undefined && { gitBranch: envVar.gitBranch }),
				...(envVar.comment && { comment: envVar.comment }),
				...(envVar.customEnvironmentIds && {
					customEnvironmentIds: envVar.customEnvironmentIds,
				}),
			}));

			return await vercel.createProjectEnvBatch(projectId, processedEnvVars, {
				...(upsert !== undefined && { upsert }),
				...(teamId && { teamId }),
				...(slug && { slug }),
			});
		}),

	getProjectDomains: protectedProcedure
		.input(getProjectDomainsSchema)
		.query(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			const { projectId, ...params } = input;
			return await vercel.getProjectDomains(projectId, params);
		}),

	getProjectEnvByKey: protectedProcedure
		.input(getProjectEnvByKeySchema)
		.query(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			const { projectId, key, teamId, slug } = input;
			return await vercel.getProjectEnvByKey(projectId, key, {
				...(teamId && { teamId }),
				...(slug && { slug }),
			});
		}),

	setProjectEnv: protectedProcedure
		.input(setProjectEnvSchema)
		.mutation(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			const { projectId, key, value, upsert, teamId, slug, ...rest } = input;

			const envVar = {
				value,
				...rest,
			};

			return await vercel.setProjectEnv(projectId, key, envVar, {
				...(upsert !== undefined && { upsert }),
				...(teamId && { teamId }),
				...(slug && { slug }),
			});
		}),

	deleteProjectEnvByKey: protectedProcedure
		.input(deleteProjectEnvByKeySchema)
		.mutation(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			const { projectId, key, teamId, slug } = input;
			return await vercel.deleteProjectEnvByKey(projectId, key, {
				...(teamId && { teamId }),
				...(slug && { slug }),
			});
		}),

	editProjectEnv: protectedProcedure
		.input(editProjectEnvSchema)
		.mutation(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			const { projectId, envVarId, teamId, slug, ...envVar } = input;

			return await vercel.editProjectEnv(projectId, envVarId, envVar, {
				...(teamId && { teamId }),
				...(slug && { slug }),
			});
		}),

	removeProjectEnv: protectedProcedure
		.input(removeProjectEnvSchema)
		.mutation(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			const { projectId, envVarId, customEnvironmentId, teamId, slug } = input;

			return await vercel.removeProjectEnv(projectId, envVarId, {
				...(customEnvironmentId && { customEnvironmentId }),
				...(teamId && { teamId }),
				...(slug && { slug }),
			});
		}),

	integrateWebsites: protectedProcedure
		.input(integrateWebsitesSchema)
		.mutation(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			const {
				projectId,
				websites: websiteConfigs,
				organizationId,
				teamId,
				slug,
			} = input;
			const results = [];
			const errors = [];

			const websiteService = new WebsiteService(ctx.db);
			const [existingEnvVars, userWebsites] = await Promise.all([
				vercel.getProjectEnvsByKey(
					projectId,
					'NEXT_PUBLIC_DATABUDDY_CLIENT_ID',
					{}
				),
				ctx.db.query.websites.findMany({
					where: buildWebsiteFilter(ctx.user.id, organizationId),
				}),
			]);

			const websiteMap = new Map(userWebsites.map((w) => [w.id, w]));
			const domainMap = new Map(userWebsites.map((w) => [w.domain, w]));

			for (const websiteConfig of websiteConfigs) {
				try {
					const domainName = websiteConfig.domainName;
					const existingEnvVar = existingEnvVars.find((envVar) => {
						const website = websiteMap.get(envVar.value);
						return website?.domain === domainName;
					});
					const existingWebsite = domainMap.get(domainName);

					let websiteToUse;
					let isNewWebsite = false;

					if (existingWebsite) {
						websiteToUse = existingWebsite;
					} else {
						websiteToUse = await websiteService.createWebsite(
							{
								name: websiteConfig.websiteName,
								domain: domainName,
								userId: ctx.user.id,
								organizationId,
							},
							{
								logContext: {
									source: 'vercel-integration',
									vercelProjectId: projectId,
								},
							}
						);
						isNewWebsite = true;
					}
					let envVarResult = null;
					if (!existingEnvVar || existingEnvVar.value !== websiteToUse.id) {
						envVarResult = await vercel.setProjectEnv(
							projectId,
							'NEXT_PUBLIC_DATABUDDY_CLIENT_ID',
							{
								value: websiteToUse.id,
								type: 'plain',
								target: websiteConfig.target,
								comment: `Databuddy website ID for ${domainName}`,
							},
							{
								upsert: true,
								...(teamId && { teamId }),
								...(slug && { slug }),
							}
						);
					}

					results.push({
						domain: domainName,
						websiteId: websiteToUse.id,
						websiteName: websiteToUse.name,
						target: websiteConfig.target,
						envVarResult,
						createdWebsite: isNewWebsite ? websiteToUse : null,
						existingWebsite: isNewWebsite ? null : websiteToUse,
						success: true,
						action: isNewWebsite ? 'created' : 'reused',
					});
				} catch (error: any) {
					errors.push({
						domain: websiteConfig.domainName,
						error: error.message || 'Unknown error occurred',
						success: false,
					});
				}
			}

			return {
				success: errors.length === 0,
				results,
				errors,
				totalProcessed: websiteConfigs.length,
				successCount: results.length,
				errorCount: errors.length,
			};
		}),

	checkIntegrationStatus: protectedProcedure
		.input(checkIntegrationStatusSchema)
		.query(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);

			const { projectId, domains, teamId, slug } = input;

			try {
				const [databeddyEnvVars, projectDomains, userWebsites] =
					await Promise.all([
						vercel.getProjectEnvsByKey(
							projectId,
							'NEXT_PUBLIC_DATABUDDY_CLIENT_ID',
							{}
						),
						vercel.getProjectDomains(projectId, {}),
						ctx.db.query.websites.findMany({
							where: buildWebsiteFilter(ctx.user.id, input.organizationId),
						}),
					]);

				const websiteMap = new Map(userWebsites.map((w) => [w.id, w]));
				const domainMap = new Map(userWebsites.map((w) => [w.domain, w]));

				const domainsToCheck =
					domains || projectDomains.domains.map((d) => d.name);

				const integrationStatus = domainsToCheck.map((domainName) => {
					const domain = projectDomains.domains.find(
						(d) => d.name === domainName
					) || { name: domainName, verified: false };
					return buildDomainIntegrationStatus(
						domain,
						databeddyEnvVars,
						websiteMap,
						domainMap
					);
				});

				const summary = buildIntegrationSummary(integrationStatus);

				return {
					projectId,
					integrationStatus,
					summary,
					totalEnvVars: databeddyEnvVars.length,
					projectDomains: projectDomains.domains.map((d) => ({
						name: d.name,
						verified: d.verified,
					})),
				};
			} catch (error: any) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: `Failed to check integration status: ${error.message}`,
				});
			}
		}),

	triageIssue: protectedProcedure
		.input(triageIssueSchema)
		.mutation(async ({ ctx, input }) => {
			const token = await getVercelToken(ctx.user.id, ctx.db);
			const vercel = new VercelSDK(token);
			const websiteService = new WebsiteService(ctx.db);

			const {
				projectId,
				action,
				domainName,
				envVarId,
				websiteId,
				organizationId,
				teamId,
				slug,
			} = input;

			try {
				switch (action) {
					case 'remove_orphaned': {
						if (!envVarId) {
							throw new TRPCError({
								code: 'BAD_REQUEST',
								message: 'envVarId is required for remove_orphaned action',
							});
						}

						await vercel.removeProjectEnv(projectId, envVarId, {
							...(teamId && { teamId }),
							...(slug && { slug }),
						});

						return {
							success: true,
							message: `Removed orphaned environment variable for ${domainName}`,
							action: 'remove_orphaned',
						};
					}

					case 'fix_domain_mismatch': {
						if (!(websiteId && envVarId)) {
							throw new TRPCError({
								code: 'BAD_REQUEST',
								message:
									'websiteId and envVarId are required for fix_domain_mismatch action',
							});
						}

						// Update the website domain to match the Vercel domain
						await websiteService.updateWebsite(
							websiteId,
							{ domain: domainName },
							ctx.user.id,
							organizationId
						);

						return {
							success: true,
							message: `Updated website domain to match ${domainName}`,
							action: 'fix_domain_mismatch',
						};
					}

					case 'remove_duplicates': {
						// Get all NEXT_PUBLIC_DATABUDDY_CLIENT_ID env vars for this project
						const databeddyEnvVars = await vercel.getProjectEnvsByKey(
							projectId,
							'NEXT_PUBLIC_DATABUDDY_CLIENT_ID',
							{}
						);

						// Find duplicates for this domain
						const duplicates = databeddyEnvVars.filter((envVar, index) => {
							// Keep the first one, remove the rest
							return index > 0;
						});

						// Remove duplicate env vars
						for (const duplicate of duplicates) {
							await vercel.removeProjectEnv(projectId, duplicate.id, {
								...(teamId && { teamId }),
								...(slug && { slug }),
							});
						}

						return {
							success: true,
							message: `Removed ${duplicates.length} duplicate environment variables for ${domainName}`,
							action: 'remove_duplicates',
							removedCount: duplicates.length,
						};
					}

					case 'create_missing_website': {
						// Create a new website for this domain
						const createdWebsite = await websiteService.createWebsite(
							{
								name: domainName.replace(/\./g, '-'), // Convert domain to valid name
								domain: domainName,
								userId: ctx.user.id,
								organizationId,
							},
							{
								logContext: {
									source: 'vercel-triage',
									vercelProjectId: projectId,
								},
							}
						);

						// Create the environment variable
						await vercel.setProjectEnv(
							projectId,
							'NEXT_PUBLIC_DATABUDDY_CLIENT_ID',
							{
								value: createdWebsite.id,
								type: 'plain',
								target: ['production', 'preview'],
								comment: `Databuddy website ID for ${domainName} (created via triage)`,
							},
							{
								upsert: true,
								...(teamId && { teamId }),
								...(slug && { slug }),
							}
						);

						return {
							success: true,
							message: `Created website "${createdWebsite.name}" and environment variable for ${domainName}`,
							action: 'create_missing_website',
							websiteId: createdWebsite.id,
							websiteName: createdWebsite.name,
						};
					}

					default:
						throw new TRPCError({
							code: 'BAD_REQUEST',
							message: `Unknown triage action: ${action}`,
						});
				}
			} catch (error: any) {
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: `Failed to execute triage action: ${error.message}`,
				});
			}
		}),
});
