import './polyfills/compression';
import { appRouter, createTRPCContext } from '@databuddy/rpc';
import cors from '@elysiajs/cors';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Elysia } from 'elysia';
import { logger } from './lib/logger';
import { assistant } from './routes/assistant';
import { health } from './routes/health';
import { query } from './routes/query';
import { reports } from './routes/reports';
import { reportScheduler } from './services/report-scheduler';

logger.info('Initializing Elysia server...');
const app = new Elysia()
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
	.use(query)
	.use(assistant)
	.use(health)
	.use(reports)
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
		logger.error('An error occurred in the Elysia server', {
			error: errorMessage,
			code,
		});

		if (error instanceof Error && error.message === 'Unauthorized') {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Authentication required',
					code: 'AUTH_REQUIRED',
				}),
				{
					status: 401,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		return { success: false, code };
	});
logger.info('Elysia server initialized.');

app.onStart(async () => {
	logger.info('🚀 API server starting...');
	await reportScheduler.syncScheduledReports();
	logger.info('🚀 API server started successfully.');
});

export default {
	fetch: app.fetch,
	port: 3001,
};

process.on('SIGINT', async () => {
	logger.info('SIGINT signal received, shutting down gracefully...');
	await reportScheduler.close();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM signal received, shutting down gracefully...');
	await reportScheduler.close();
	process.exit(0);
});
