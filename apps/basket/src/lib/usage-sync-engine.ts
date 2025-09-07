import { redis } from '@databuddy/redis';
import { Autumn as autumn } from 'autumn-js';
import { logger } from './logger';

interface UsageEvent {
	customer_id: string;
	feature_id?: string;
	event_name?: string;
	value: number;
	timestamp: number;
	eventId?: string;
	metadata?: Record<string, any>;
}

interface SyncEngineConfig {
	batchSize: number;
	syncIntervalMs: number;
	maxRetries: number;
	retryDelayMs: number;
	redisKeyPrefix: string;
}

export class UsageSyncEngine {
	private config: SyncEngineConfig;
	private isRunning = false;
	private syncTimer?: NodeJS.Timeout;

	constructor(config: Partial<SyncEngineConfig> = {}) {
		this.config = {
			batchSize: 100,
			syncIntervalMs: 30000, // 30 seconds
			maxRetries: 3,
			retryDelayMs: 1000,
			redisKeyPrefix: 'usage:sync',
			...config,
		};
	}

	private getRedisKeys() {
		const prefix = this.config.redisKeyPrefix;
		return {
			pendingEvents: `${prefix}:pending`,
			failedEvents: `${prefix}:failed`,
			retryQueue: `${prefix}:retry`,
			lastSyncTime: `${prefix}:last_sync`,
			stats: `${prefix}:stats`,
		};
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			logger.warn('Usage sync engine is already running');
			return;
		}

		this.isRunning = true;
		logger.info('Starting usage sync engine', {
			config: this.config,
		});

		await this.initializeStats();
		this.syncTimer = setInterval(() => {
			this.processBatch().catch((error) => {
				logger.error('Error processing batch in sync timer', { error });
			});
		}, this.config.syncIntervalMs);

		// Initial sync
		this.processBatch().catch((error) => {
			logger.error('Error in initial batch processing', { error });
		});
	}

	async stop(): Promise<void> {
		if (!this.isRunning) {
			return;
		}

		this.isRunning = false;
		if (this.syncTimer) {
			clearInterval(this.syncTimer);
			this.syncTimer = undefined;
		}

		// Process any remaining events before stopping
		await this.processBatch();
		logger.info('Usage sync engine stopped');
	}

	private async initializeStats(): Promise<void> {
		const keys = this.getRedisKeys();
		const stats = {
			created_at: Date.now(),
			total_events: 0,
			successful_syncs: 0,
			failed_syncs: 0,
			last_batch_time: 0,
			last_batch_size: 0,
		};

		const existing = await redis.get(keys.stats);
		if (!existing) {
			await redis.set(keys.stats, JSON.stringify(stats));
		}
	}

	async queueUsageEvent(event: UsageEvent): Promise<void> {
		const keys = this.getRedisKeys();
		
		// Validate event
		if (!event.customer_id || (!event.feature_id && !event.event_name)) {
			logger.error('Invalid usage event: missing required fields', { event });
			return;
		}

		// Add timestamp if not provided
		if (!event.timestamp) {
			event.timestamp = Date.now();
		}

		// Generate eventId if not provided
		if (!event.eventId) {
			event.eventId = `${event.customer_id}_${event.timestamp}_${Math.random().toString(36).substring(7)}`;
		}

		try {
			await redis.rpush(keys.pendingEvents, JSON.stringify(event));
			
			// Update stats
			await this.incrementStat('total_events');
			
			logger.debug('Usage event queued', { 
				eventId: event.eventId,
				customer_id: event.customer_id,
				feature_id: event.feature_id,
				event_name: event.event_name,
			});
		} catch (error) {
			logger.error('Failed to queue usage event', { error, event });
			throw error;
		}
	}

	private async incrementStat(statName: string, value = 1): Promise<void> {
		const keys = this.getRedisKeys();
		
		try {
			const statsStr = await redis.get(keys.stats);
			if (statsStr) {
				const stats = JSON.parse(statsStr);
				stats[statName] = (stats[statName] || 0) + value;
				await redis.set(keys.stats, JSON.stringify(stats));
			}
		} catch (error) {
			logger.error('Failed to increment stat', { error, statName, value });
		}
	}

	private async processBatch(): Promise<void> {
		if (!this.isRunning) {
			return;
		}

		const keys = this.getRedisKeys();
		const batchStartTime = Date.now();
		let batchSize = 0;

		try {
			// First, retry any failed events
			await this.retryFailedEvents();

			// Get batch of pending events
			const eventStrings = await redis.lpop(keys.pendingEvents, this.config.batchSize);
			
			if (!eventStrings || eventStrings.length === 0) {
				return;
			}

			batchSize = eventStrings.length;
			logger.info('Processing usage events batch', { batchSize });

			const events: UsageEvent[] = [];
			for (const eventStr of eventStrings) {
				try {
					events.push(JSON.parse(eventStr));
				} catch (parseError) {
					logger.error('Failed to parse usage event', { parseError, eventStr });
				}
			}

			if (events.length === 0) {
				return;
			}

			// Group events by customer for better API efficiency
			const eventsByCustomer = this.groupEventsByCustomer(events);

			// Sync each customer's events to Autumn
			const results = await Promise.allSettled(
				Object.entries(eventsByCustomer).map(([customerId, customerEvents]) =>
					this.syncCustomerEvents(customerId, customerEvents)
				)
			);

			// Handle results
			let successCount = 0;
			let failCount = 0;

			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				if (result.status === 'fulfilled') {
					successCount += result.value;
				} else {
					failCount++;
					logger.error('Failed to sync customer events', { 
						error: result.reason,
						customerId: Object.keys(eventsByCustomer)[i],
					});
				}
			}

			// Update stats
			await this.incrementStat('successful_syncs', successCount);
			await this.incrementStat('failed_syncs', failCount);
			
			const processingTime = Date.now() - batchStartTime;
			await this.updateBatchStats(batchSize, processingTime);

			logger.info('Batch processing completed', {
				batchSize,
				successCount,
				failCount,
				processingTimeMs: processingTime,
			});

		} catch (error) {
			logger.error('Error processing batch', { error, batchSize });
			
			if (batchSize > 0) {
				await this.incrementStat('failed_syncs', 1);
			}
		}
	}

	private groupEventsByCustomer(events: UsageEvent[]): Record<string, UsageEvent[]> {
		const groups: Record<string, UsageEvent[]> = {};
		
		for (const event of events) {
			if (!groups[event.customer_id]) {
				groups[event.customer_id] = [];
			}
			groups[event.customer_id].push(event);
		}
		
		return groups;
	}

	private async syncCustomerEvents(customerId: string, events: UsageEvent[]): Promise<number> {
		let successCount = 0;

		for (const event of events) {
			try {
				if (event.feature_id) {
					await autumn.track({
						customer_id: customerId,
						feature_id: event.feature_id,
						value: event.value,
					});
				} else if (event.event_name) {
					await autumn.track({
						customer_id: customerId,
						event_name: event.event_name,
						value: event.value,
					});
				}
				
				successCount++;
				logger.debug('Successfully synced usage event to Autumn', {
					customerId,
					eventId: event.eventId,
					feature_id: event.feature_id,
					event_name: event.event_name,
				});

			} catch (error) {
				logger.error('Failed to sync usage event to Autumn', {
					error,
					customerId,
					eventId: event.eventId,
					feature_id: event.feature_id,
					event_name: event.event_name,
				});

				// Queue for retry
				await this.queueForRetry(event);
			}
		}

		return successCount;
	}

	private async queueForRetry(event: UsageEvent, retryCount = 0): Promise<void> {
		if (retryCount >= this.config.maxRetries) {
			// Move to failed events
			const keys = this.getRedisKeys();
			await redis.rpush(keys.failedEvents, JSON.stringify({
				...event,
				failed_at: Date.now(),
				retry_count: retryCount,
			}));
			return;
		}

		const keys = this.getRedisKeys();
		const retryEvent = {
			...event,
			retry_count: retryCount,
			retry_at: Date.now() + (this.config.retryDelayMs * Math.pow(2, retryCount)), // Exponential backoff
		};

		await redis.rpush(keys.retryQueue, JSON.stringify(retryEvent));
	}

	private async retryFailedEvents(): Promise<void> {
		const keys = this.getRedisKeys();
		const currentTime = Date.now();
		
		// Get all retry events
		const retryEventStrings = await redis.lrange(keys.retryQueue, 0, -1);
		
		if (retryEventStrings.length === 0) {
			return;
		}

		const eventsToRetry: UsageEvent[] = [];
		const eventsToKeep: string[] = [];

		for (const eventStr of retryEventStrings) {
			try {
				const event = JSON.parse(eventStr);
				if (event.retry_at && event.retry_at <= currentTime) {
					eventsToRetry.push(event);
				} else {
					eventsToKeep.push(eventStr);
				}
			} catch (error) {
				logger.error('Failed to parse retry event', { error, eventStr });
			}
		}

		if (eventsToRetry.length > 0) {
			// Clear retry queue and add back events that shouldn't be retried yet
			await redis.del(keys.retryQueue);
			if (eventsToKeep.length > 0) {
				await redis.rpush(keys.retryQueue, ...eventsToKeep);
			}

			// Retry events
			for (const event of eventsToRetry) {
				try {
					const customerId = event.customer_id;
					await this.syncCustomerEvents(customerId, [event]);
				} catch (error) {
					// Queue for another retry
					const retryCount = (event.retry_count || 0) + 1;
					await this.queueForRetry(event, retryCount);
				}
			}
		}
	}

	private async updateBatchStats(batchSize: number, processingTime: number): Promise<void> {
		const keys = this.getRedisKeys();
		
		try {
			const statsStr = await redis.get(keys.stats);
			if (statsStr) {
				const stats = JSON.parse(statsStr);
				stats.last_batch_time = processingTime;
				stats.last_batch_size = batchSize;
				await redis.set(keys.stats, JSON.stringify(stats));
			}
			
			await redis.set(keys.lastSyncTime, Date.now().toString());
		} catch (error) {
			logger.error('Failed to update batch stats', { error });
		}
	}

	async getStats(): Promise<any> {
		const keys = this.getRedisKeys();
		
		try {
			const [statsStr, pendingCount, failedCount, retryCount, lastSyncStr] = await Promise.all([
				redis.get(keys.stats),
				redis.llen(keys.pendingEvents),
				redis.llen(keys.failedEvents),
				redis.llen(keys.retryQueue),
				redis.get(keys.lastSyncTime),
			]);

			const stats = statsStr ? JSON.parse(statsStr) : {};
			
			return {
				...stats,
				pending_events: pendingCount,
				failed_events: failedCount,
				retry_queue_size: retryCount,
				last_sync_time: lastSyncStr ? parseInt(lastSyncStr) : null,
				is_running: this.isRunning,
				config: this.config,
			};
		} catch (error) {
			logger.error('Failed to get stats', { error });
			return {
				error: 'Failed to retrieve stats',
				is_running: this.isRunning,
			};
		}
	}

	async clearFailedEvents(): Promise<number> {
		const keys = this.getRedisKeys();
		const count = await redis.llen(keys.failedEvents);
		await redis.del(keys.failedEvents);
		logger.info('Cleared failed events', { count });
		return count;
	}

	async reprocessFailedEvents(): Promise<void> {
		const keys = this.getRedisKeys();
		
		// Move all failed events back to pending
		let movedCount = 0;
		let event: string | null;
		
		while ((event = await redis.lpop(keys.failedEvents))) {
			try {
				const eventData = JSON.parse(event);
				// Remove retry metadata and requeue
				delete eventData.failed_at;
				delete eventData.retry_count;
				
				await redis.rpush(keys.pendingEvents, JSON.stringify(eventData));
				movedCount++;
			} catch (error) {
				logger.error('Failed to reprocess failed event', { error, event });
			}
		}
		
		logger.info('Requeued failed events for processing', { movedCount });
	}

	async triggerImmediateProcessing(): Promise<void> {
		if (!this.isRunning) {
			throw new Error('Sync engine is not running');
		}
		
		logger.info('Triggering immediate batch processing');
		await this.processBatch();
	}
}

// Export a default instance
export const usageSyncEngine = new UsageSyncEngine();