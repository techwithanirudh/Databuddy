import { auth } from '@databuddy/auth';
import { db, websites } from '@databuddy/db';
import { cacheable } from '@databuddy/redis';
import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import type { StreamingUpdate } from '../agent';
import {
	type AssistantContext,
	type AssistantRequest,
	createStreamingResponse,
	processAssistantRequest,
} from '../agent';
import { createRateLimitMiddleware } from '../middleware/rate-limit';
import { AssistantRequestSchema } from '../schemas';

// biome-ignore lint/suspicious/useAwait: async generator function doesn't need await
async function* createErrorResponse(
	message: string
): AsyncGenerator<StreamingUpdate> {
	yield { type: 'error', content: message };
}

const getCachedWebsite = cacheable(
	async (websiteId: string) => {
		try {
			const website = await db.query.websites.findFirst({
				where: eq(websites.id, websiteId),
			});
			return website || null;
		} catch {
			return null;
		}
	},
	{
		expireInSec: 300,
		prefix: 'assistant-website',
		staleWhileRevalidate: true,
		staleTime: 60,
	}
);

async function validateWebsite(websiteId: string) {
	const website = await getCachedWebsite(websiteId);

	if (!website) {
		return { success: false, error: 'Website not found' };
	}

	return { success: true, website };
}

export const assistant = new Elysia({ prefix: '/v1/assistant' })
	.use(createRateLimitMiddleware({ type: 'expensive' }))
	.derive(async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			throw new Error('Unauthorized');
		}

		return { user: session.user, session };
	})
	.post(
		'/stream',
		async ({ body, user }) => {
			const { message, website_id, model, context } = body;

			try {
				const websiteValidation = await validateWebsite(website_id);

				if (!websiteValidation.success) {
					return createStreamingResponse(
						createErrorResponse(websiteValidation.error || 'Website not found')
					);
				}

				const { website } = websiteValidation;

				if (!website) {
					return createStreamingResponse(
						createErrorResponse('Website not found')
					);
				}

				const assistantRequest: AssistantRequest = {
					message,
					website_id,
					website_hostname: website.domain,
					model: model || 'chat',
					context,
				};

				const assistantContext: AssistantContext = {
					user,
					website,
					debugInfo: {},
				};

				const updates = processAssistantRequest(
					assistantRequest,
					assistantContext
				);
				return createStreamingResponse(updates);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error occurred';
				return createStreamingResponse(createErrorResponse(errorMessage));
			}
		},
		{
			body: AssistantRequestSchema,
		}
	);
