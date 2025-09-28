import './polyfills/compression';
import { auth } from '@databuddy/auth';
import { appRouter, createTRPCContext } from '@databuddy/rpc';
import cors from '@elysiajs/cors';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { autumnHandler } from 'autumn-js/elysia';
import { Elysia } from 'elysia';
import { logger } from './lib/logger';
import { assistant } from './routes/assistant';
// import { customSQL } from './routes/custom-sql';
import { exportRoute } from './routes/export';
import { health } from './routes/health';
import { publicApi } from './routes/public';
import { query } from './routes/query';

const app = new Elysia()
	.use(publicApi) // Mount public API first, without main CORS
	.use(
		cors({
			credentials: true,
			origin: [
				/(?:^|\.)databuddy\.cc$/,
				...(process.env.NODE_ENV === 'development'
					? ['http://localhost:3000']
					: []),
			],
		})
	)
	.use(health)
	.use(
		autumnHandler({
			identify: async ({ request }) => {
				const session = await auth.api.getSession({
					headers: request.headers,
				});

				return {
					customerId: session?.user.id,
					customerData: {
						name: session?.user.name,
						email: session?.user.email,
					},
				};
			},
		})
	)
	.use(query)
	// .use(customSQL)
	.use(assistant)
	.use(exportRoute)
	.all('/trpc/*', ({ request }) => {
		return fetchRequestHandler({
			endpoint: '/trpc',
			router: appRouter,
			req: request,
			createContext: () => createTRPCContext({ headers: request.headers }),
		});
	})
	.onError(({ error, code }) => {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ message: errorMessage, code, error });

		return new Response(
			JSON.stringify({
				success: false,
				error: errorMessage,
				code: code ?? 'INTERNAL_SERVER_ERROR',
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	});

export default {
	fetch: app.fetch,
	port: 3001,
};

process.on('SIGINT', () => {
	logger.info('SIGINT signal received, shutting down...');
	process.exit(0);
});

process.on('SIGTERM', () => {
	logger.info('SIGTERM signal received, shutting down...');
	process.exit(0);
});
