import { auth } from '@databuddy/auth';
import { db, userPreferences, websites } from '@databuddy/db';
import { cacheable } from '@databuddy/redis';
import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { createRateLimitMiddleware } from '../middleware/rate-limit';
import { compileQuery, executeQuery } from '../query';
import { QueryBuilders } from '../query/builders';
import type { QueryRequest } from '../query/types';
import {
	CompileRequestSchema,
	type CompileRequestType,
	DynamicQueryRequestSchema,
	type DynamicQueryRequestType,
} from '../schemas';

interface QueryParams {
	start_date?: string;
	startDate?: string;
	end_date?: string;
	endDate?: string;
	website_id?: string;
	timezone?: string;
}

async function getTimezone(
	request: Request,
	session: { user?: { id: string } } | null
) {
	const url = new URL(request.url);
	const headerTimezone = request.headers.get('x-timezone');
	const paramTimezone = url.searchParams.get('timezone');

	if (session?.user) {
		const pref = await db.query.userPreferences.findFirst({
			where: eq(userPreferences.userId, session.user.id),
		});
		if (pref?.timezone && pref.timezone !== 'auto') {
			return pref.timezone;
		}
	}

	return headerTimezone || paramTimezone || 'UTC';
}

async function deriveContext({ request }: { request: Request }) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	const url = new URL(request.url);
	const website_id = url.searchParams.get('website_id');

	if (!website_id) {
		if (!session?.user) {
			throw new Error('Unauthorized');
		}
		const timezone = await getTimezone(request, session);
		return { user: session.user, session, timezone };
	}

	const website = await db.query.websites.findFirst({
		where: eq(websites.id, website_id),
	});

	if (!website) {
		throw new Error('Website not found');
	}

	if (website.isPublic) {
		const timezone = await getTimezone(request, null);
		return { user: null, session: null, website, timezone };
	}

	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const timezone = await getTimezone(request, session);
	return { user: session.user, session, website, timezone };
}

export const query = new Elysia({ prefix: '/v1/query' })
	.use(createRateLimitMiddleware({ type: 'api' }))
	.derive(deriveContext)
	.get('/types', () => ({
		success: true,
		types: Object.keys(QueryBuilders),
		configs: Object.fromEntries(
			Object.entries(QueryBuilders).map(([key, config]) => [
				key,
				{
					allowedFilters: config.allowedFilters || [],
					customizable: config.customizable,
					defaultLimit: config.limit,
				},
			])
		),
	}))

	.post(
		'/compile',
		async ({
			body,
			query: queryParams,
		}: {
			body: CompileRequestType;
			query: { website_id?: string };
		}) => {
			try {
				const { website_id } = queryParams;
				const websiteDomain = website_id
					? await getWebsiteDomain(website_id)
					: null;

				const result = compileQuery(body as QueryRequest, websiteDomain);
				return {
					success: true,
					...result,
				};
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Compilation failed',
				};
			}
		},
		{
			body: CompileRequestSchema,
		}
	)

	.post(
		'/',
		async ({
			body,
			query: queryParams,
			timezone,
		}: {
			body: DynamicQueryRequestType | DynamicQueryRequestType[];
			query: { website_id?: string };
			timezone: string;
		}) => {
			try {
				if (Array.isArray(body)) {
					const uniqueWebsiteIds = [
						...new Set(body.flatMap((req) => req.parameters)),
					];
					const domainCache = await getCachedWebsiteDomain(uniqueWebsiteIds);

					const results = await Promise.all(
						body.map(async (queryRequest) => {
							try {
								return await executeDynamicQuery(
									queryRequest,
									{
										...queryParams,
										timezone,
									},
									domainCache
								);
							} catch (error) {
								return {
									success: false,
									error:
										error instanceof Error ? error.message : 'Query failed',
								};
							}
						})
					);

					return {
						success: true,
						batch: true,
						results,
					};
				}

				const result = await executeDynamicQuery(body, {
					...queryParams,
					timezone,
				});
				return {
					success: true,
					...result,
				};
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Query failed',
				};
			}
		},
		{
			body: t.Union([
				DynamicQueryRequestSchema,
				t.Array(DynamicQueryRequestSchema),
			]),
		}
	);

const getWebsiteDomain = cacheable(
	async (websiteId: string): Promise<string | null> => {
		try {
			const website = await db.query.websites.findFirst({
				where: eq(websites.id, websiteId),
			});
			return website?.domain || null;
		} catch {
			return null;
		}
	},
	{
		expireInSec: 300,
		prefix: 'website-domain',
		staleWhileRevalidate: true,
		staleTime: 60,
	}
);

const getCachedWebsiteDomain = cacheable(
	async (websiteIds: string[]): Promise<Record<string, string | null>> => {
		const results: Record<string, string | null> = {};

		await Promise.all(
			websiteIds.map(async (id) => {
				results[id] = await getWebsiteDomain(id);
			})
		);

		return results;
	},
	{
		expireInSec: 300,
		prefix: 'website-domains-batch',
		staleWhileRevalidate: true,
		staleTime: 60,
	}
);

async function executeDynamicQuery(
	request: DynamicQueryRequestType,
	queryParams: QueryParams,
	domainCache?: Record<string, string | null>
) {
	const startDate = queryParams.start_date || queryParams.startDate;
	const endDate = queryParams.end_date || queryParams.endDate;
	const websiteId = queryParams.website_id;
	const websiteDomain = websiteId
		? (domainCache?.[websiteId] ?? (await getWebsiteDomain(websiteId)))
		: null;

	const getTimeUnit = (granularity?: string): 'hour' | 'day' => {
		if (['hourly', 'hour'].includes(granularity || '')) {
			return 'hour';
		}
		return 'day';
	};

	function validateParameterRequest(
		parameter: string,
		siteId: string | undefined,
		start: string | undefined,
		end: string | undefined
	):
		| { success: true; siteId: string; start: string; end: string }
		| { success: false; error: string } {
		if (!QueryBuilders[parameter]) {
			return {
				success: false,
				error: `Unknown query type: ${parameter}`,
			};
		}

		if (!(siteId && start && end)) {
			return {
				success: false,
				error:
					'Missing required parameters: website_id, start_date, or end_date',
			};
		}

		return { success: true, siteId, start, end };
	}

	async function processParameter(
		parameter: string,
		dynamicRequest: DynamicQueryRequestType,
		params: QueryParams,
		siteId: string | undefined,
		start: string | undefined,
		end: string | undefined,
		domain: string | null
	) {
		const validation = validateParameterRequest(parameter, siteId, start, end);
		if (!validation.success) {
			return {
				parameter,
				success: false,
				error: validation.error,
				data: [],
			};
		}

		try {
			const queryRequest = {
				projectId: validation.siteId,
				type: parameter,
				from: validation.start,
				to: validation.end,
				timeUnit: getTimeUnit(dynamicRequest.granularity),
				filters: dynamicRequest.filters || [],
				limit: dynamicRequest.limit || 100,
				offset: dynamicRequest.page
					? (dynamicRequest.page - 1) * (dynamicRequest.limit || 100)
					: 0,
				timezone: params.timezone,
			};

			const data = await executeQuery(queryRequest, domain, params.timezone);

			return {
				parameter,
				success: true,
				data: data || [],
			};
		} catch (error) {
			return {
				parameter,
				success: false,
				error: error instanceof Error ? error.message : 'Query failed',
				data: [],
			};
		}
	}

	const parameterResults = await Promise.all(
		request.parameters.map((param: string) => {
			return processParameter(
				param,
				request,
				queryParams,
				websiteId,
				startDate,
				endDate,
				websiteDomain
			);
		})
	);

	return {
		queryId: request.id,
		data: parameterResults,
		meta: {
			parameters: request.parameters,
			total_parameters: request.parameters.length,
			page: request.page || 1,
			limit: request.limit || 100,
			filters_applied: request.filters?.length || 0,
		},
	};
}
