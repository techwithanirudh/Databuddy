import { Elysia } from 'elysia';
import { usageSyncEngine } from '../lib/usage-sync-engine';
import { usageTracker } from '../lib/usage-tracker';
import { logger } from '../lib/logger';

const app = new Elysia({ prefix: '/usage-sync' })
	.get('/status', async () => {
		try {
			const stats = await usageSyncEngine.getStats();
			return {
				status: 'success',
				data: {
					sync_engine: stats,
					tracker_enabled: usageTracker.isTrackingEnabled(),
					timestamp: Date.now(),
				},
			};
		} catch (error) {
			logger.error('Failed to get usage sync status', { error });
			return {
				status: 'error',
				message: 'Failed to retrieve status',
				error: String(error),
			};
		}
	})

	.post('/start', async () => {
		try {
			await usageSyncEngine.start();
			return {
				status: 'success',
				message: 'Usage sync engine started',
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error('Failed to start usage sync engine', { error });
			return {
				status: 'error',
				message: 'Failed to start sync engine',
				error: String(error),
			};
		}
	})

	.post('/stop', async () => {
		try {
			await usageSyncEngine.stop();
			return {
				status: 'success',
				message: 'Usage sync engine stopped',
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error('Failed to stop usage sync engine', { error });
			return {
				status: 'error',
				message: 'Failed to stop sync engine',
				error: String(error),
			};
		}
	})

	.post('/process-now', async () => {
		try {
			await usageSyncEngine.triggerImmediateProcessing();
			return {
				status: 'success',
				message: 'Immediate processing triggered',
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error('Failed to trigger immediate processing', { error });
			return {
				status: 'error',
				message: 'Failed to trigger processing',
				error: String(error),
			};
		}
	})

	.post('/clear-failed', async () => {
		try {
			const clearedCount = await usageSyncEngine.clearFailedEvents();
			return {
				status: 'success',
				message: `Cleared ${clearedCount} failed events`,
				cleared_count: clearedCount,
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error('Failed to clear failed events', { error });
			return {
				status: 'error',
				message: 'Failed to clear failed events',
				error: String(error),
			};
		}
	})

	.post('/reprocess-failed', async () => {
		try {
			await usageSyncEngine.reprocessFailedEvents();
			return {
				status: 'success',
				message: 'Failed events requeued for processing',
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error('Failed to reprocess failed events', { error });
			return {
				status: 'error',
				message: 'Failed to requeue failed events',
				error: String(error),
			};
		}
	})

	.post('/tracker/enable', async () => {
		try {
			usageTracker.enable();
			return {
				status: 'success',
				message: 'Usage tracker enabled',
				enabled: true,
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error('Failed to enable usage tracker', { error });
			return {
				status: 'error',
				message: 'Failed to enable tracker',
				error: String(error),
			};
		}
	})

	.post('/tracker/disable', async () => {
		try {
			usageTracker.disable();
			return {
				status: 'success',
				message: 'Usage tracker disabled',
				enabled: false,
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error('Failed to disable usage tracker', { error });
			return {
				status: 'error',
				message: 'Failed to disable tracker',
				error: String(error),
			};
		}
	})

	.post('/track-custom', async ({ body }: { body: any }) => {
		try {
			const { customer_id, feature_id, event_name, value = 1, metadata } = body;

			if (!customer_id) {
				return {
					status: 'error',
					message: 'customer_id is required',
				};
			}

			if (!feature_id && !event_name) {
				return {
					status: 'error',
					message: 'Either feature_id or event_name is required',
				};
			}

			await usageTracker.trackCustomUsage(
				customer_id,
				feature_id,
				event_name,
				value,
				metadata
			);

			return {
				status: 'success',
				message: 'Custom usage event queued',
				event: {
					customer_id,
					feature_id,
					event_name,
					value,
				},
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error('Failed to track custom usage', { error, body });
			return {
				status: 'error',
				message: 'Failed to track custom usage',
				error: String(error),
			};
		}
	});

export default app;