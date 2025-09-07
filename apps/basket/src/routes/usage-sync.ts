import { Elysia } from 'elysia';
import { usageSyncEngine } from '../lib/usage-sync-engine';
import { usageTracker } from '../lib/usage-tracker';
import { logger } from '../lib/logger';

const app = new Elysia({ prefix: '/usage-sync' })
	.get('/status', async () => {
		logger.debug('GET /usage-sync/status called');
		try {
			logger.debug('Fetching usage sync engine stats...');
			const stats = await usageSyncEngine.getStats();
			logger.debug('Stats retrieved successfully', { statsKeys: Object.keys(stats) });
			
			const trackerEnabled = usageTracker.isTrackingEnabled();
			logger.debug('Tracker status checked', { trackerEnabled });
			
			const response = {
				status: 'success',
				data: {
					sync_engine: stats,
					tracker_enabled: trackerEnabled,
					timestamp: Date.now(),
				},
			};
			logger.debug('Status response prepared', { responseKeys: Object.keys(response.data) });
			return response;
		} catch (error) {
			logger.error('Failed to get usage sync status', { 
				error,
				errorMessage: error instanceof Error ? error.message : String(error)
			});
			return {
				status: 'error',
				message: 'Failed to retrieve status',
				error: String(error),
			};
		}
	})

	.post('/start', async () => {
		logger.debug('POST /usage-sync/start called');
		try {
			logger.debug('Starting usage sync engine...');
			await usageSyncEngine.start();
			logger.debug('Usage sync engine started successfully');
			return {
				status: 'success',
				message: 'Usage sync engine started',
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error('Failed to start usage sync engine', { 
				error,
				errorMessage: error instanceof Error ? error.message : String(error)
			});
			return {
				status: 'error',
				message: 'Failed to start sync engine',
				error: String(error),
			};
		}
	})

	.post('/stop', async () => {
		logger.debug('POST /usage-sync/stop called');
		try {
			logger.debug('Stopping usage sync engine...');
			await usageSyncEngine.stop();
			logger.debug('Usage sync engine stopped successfully');
			return {
				status: 'success',
				message: 'Usage sync engine stopped',
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error('Failed to stop usage sync engine', { 
				error,
				errorMessage: error instanceof Error ? error.message : String(error)
			});
			return {
				status: 'error',
				message: 'Failed to stop sync engine',
				error: String(error),
			};
		}
	})

	.post('/process-now', async () => {
		logger.debug('POST /usage-sync/process-now called');
		try {
			logger.debug('Triggering immediate processing...');
			await usageSyncEngine.triggerImmediateProcessing();
			logger.debug('Immediate processing completed successfully');
			return {
				status: 'success',
				message: 'Immediate processing triggered',
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error('Failed to trigger immediate processing', { 
				error,
				errorMessage: error instanceof Error ? error.message : String(error)
			});
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
		logger.debug('POST /usage-sync/track-custom called', { bodyKeys: body ? Object.keys(body) : [] });
		try {
			const { customer_id, feature_id, event_name, value = 1, metadata } = body;
			logger.debug('Extracted request parameters', {
				customer_id,
				feature_id,
				event_name,
				value,
				hasMetadata: !!metadata
			});

			if (!customer_id) {
				logger.debug('Validation failed: missing customer_id');
				return {
					status: 'error',
					message: 'customer_id is required',
				};
			}

			if (!feature_id && !event_name) {
				logger.debug('Validation failed: missing both feature_id and event_name');
				return {
					status: 'error',
					message: 'Either feature_id or event_name is required',
				};
			}
			
			logger.debug('Validation passed, tracking custom usage...');
			await usageTracker.trackCustomUsage(
				customer_id,
				feature_id,
				event_name,
				value,
				metadata
			);
			logger.debug('Custom usage tracked successfully');

			const response = {
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
			logger.debug('Custom usage response prepared', { response });
			return response;
		} catch (error) {
			logger.error('Failed to track custom usage', { 
				error, 
				body,
				errorMessage: error instanceof Error ? error.message : String(error)
			});
			return {
				status: 'error',
				message: 'Failed to track custom usage',
				error: String(error),
			};
		}
	});

export default app;