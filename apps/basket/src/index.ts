// import './polyfills/compression'

import { Elysia } from 'elysia';
import { logger } from './lib/logger';
import { usageSyncEngine } from './lib/usage-sync-engine';
import basketRouter from './routes/basket';
import emailRouter from './routes/email';
import observabilityRouter from './routes/observability';
import stripeRouter from './routes/stripe';
import usageSyncRouter from './routes/usage-sync';
import './polyfills/compression';
// import { checkBotId } from "botid/server";

const app = new Elysia()
	.onError(({ error }) => {
		logger.error(
			new Error(
				`${error instanceof Error ? error.name : 'Unknown'}: ${error instanceof Error ? error.message : 'Unknown'}`
			)
		);
	})
	.onBeforeHandle(({ request, set }) => {
		// const { isBot } = await checkBotId();
		// if (isBot) {
		//   return new Response(null, { status: 403 });
		// }
		const origin = request.headers.get('origin');
		if (origin) {
			set.headers ??= {};
			set.headers['Access-Control-Allow-Origin'] = origin;
			set.headers['Access-Control-Allow-Methods'] =
				'POST, GET, OPTIONS, PUT, DELETE';
			set.headers['Access-Control-Allow-Headers'] =
				'Content-Type, Authorization, X-Requested-With, databuddy-client-id, databuddy-sdk-name, databuddy-sdk-version';
			set.headers['Access-Control-Allow-Credentials'] = 'true';
		}
	})
	.options('*', () => new Response(null, { status: 204 }))
	.use(basketRouter)
	.use(stripeRouter)
	.use(emailRouter)
	.use(observabilityRouter)
	.use(usageSyncRouter)
	.get('/health', () => ({ status: 'ok', version: '1.0.0' }));

// Initialize usage sync engine on startup
const startServer = async () => {
	try {
		// Start the usage sync engine
		if (process.env.USAGE_SYNC_ENABLED !== 'false') {
			await usageSyncEngine.start();
			logger.info('Usage sync engine started successfully');
		} else {
			logger.info('Usage sync engine disabled via environment variable');
		}
	} catch (error) {
		logger.error('Failed to start usage sync engine', { error });
		// Continue with server startup even if sync engine fails
	}
};

// Start the sync engine
startServer().catch(error => {
	logger.error('Error during server startup', { error });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
	logger.info('SIGTERM received, shutting down gracefully');
	try {
		await usageSyncEngine.stop();
		logger.info('Usage sync engine stopped');
	} catch (error) {
		logger.error('Error stopping usage sync engine', { error });
	}
	process.exit(0);
});

process.on('SIGINT', async () => {
	logger.info('SIGINT received, shutting down gracefully');
	try {
		await usageSyncEngine.stop();
		logger.info('Usage sync engine stopped');
	} catch (error) {
		logger.error('Error stopping usage sync engine', { error });
	}
	process.exit(0);
});

export default {
	port: process.env.PORT || 4000,
	fetch: app.fetch,
};
