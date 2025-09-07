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
		logger.debug('start() called', { isRunning: this.isRunning });
		
		if (this.isRunning) {
			logger.warn('Usage sync engine is already running');
			return;
		}

		this.isRunning = true;
		logger.info('Starting usage sync engine', {
			config: this.config,
		});

		try {
			logger.debug('Initializing stats...');
			await this.initializeStats();
			logger.debug('Stats initialized successfully');

			logger.debug('Setting up sync timer', {
				intervalMs: this.config.syncIntervalMs
			});
			this.syncTimer = setInterval(() => {
				logger.debug('Timer triggered batch processing');
				this.processBatch().catch((error) => {
					logger.error('Error processing batch in sync timer', { error });
				});
			}, this.config.syncIntervalMs);

			// Initial sync
			logger.debug('Starting initial batch processing');
			this.processBatch().catch((error) => {
				logger.error('Error in initial batch processing', { error });
			});
			
			logger.info('Usage sync engine started successfully');
		} catch (error) {
			logger.error('Failed to start usage sync engine', { error });
			this.isRunning = false;
			throw error;
		}
	}

	async stop(): Promise<void> {
		logger.debug('stop() called', { isRunning: this.isRunning });
		
		if (!this.isRunning) {
			logger.debug('Sync engine is not running, nothing to stop');
			return;
		}

		logger.info('Stopping usage sync engine...');
		this.isRunning = false;
		
		if (this.syncTimer) {
			logger.debug('Clearing sync timer');
			clearInterval(this.syncTimer);
			this.syncTimer = undefined;
		}

		// Process any remaining events before stopping
		logger.debug('Processing final batch before shutdown');
		try {
			await this.processBatch();
			logger.debug('Final batch processed successfully');
		} catch (error) {
			logger.error('Error processing final batch during shutdown', { error });
		}
		
		logger.info('Usage sync engine stopped');
	}

	private async initializeStats(): Promise<void> {
		logger.debug('initializeStats() called');
		const keys = this.getRedisKeys();
		logger.debug('Redis keys generated', { keys });
		
		const stats = {
			created_at: Date.now(),
			total_events: 0,
			successful_syncs: 0,
			failed_syncs: 0,
			last_batch_time: 0,
			last_batch_size: 0,
		};
		logger.debug('Default stats created', { stats });

		try {
			const existing = await redis.get(keys.stats);
			logger.debug('Checked for existing stats', { exists: !!existing });
			
			if (!existing) {
				logger.debug('No existing stats found, creating new ones');
				await redis.set(keys.stats, JSON.stringify(stats));
				logger.debug('Stats initialized in Redis');
			} else {
				logger.debug('Using existing stats', { existing });
			}
		} catch (error) {
			logger.error('Failed to initialize stats', { error, keys, stats });
			throw error;
		}
	}

	async queueUsageEvent(event: UsageEvent): Promise<void> {
		logger.debug('queueUsageEvent() called', { 
			eventPreview: {
				customer_id: event.customer_id,
				feature_id: event.feature_id,
				event_name: event.event_name,
				value: event.value,
				hasTimestamp: !!event.timestamp,
				hasEventId: !!event.eventId
			}
		});
		
		const keys = this.getRedisKeys();
		logger.debug('Redis keys for queueing', { keys });
		
		// Validate event
		if (!event.customer_id || (!event.feature_id && !event.event_name)) {
			logger.error('Invalid usage event: missing required fields', { 
				event,
				hasCustomerId: !!event.customer_id,
				hasFeatureId: !!event.feature_id,
				hasEventName: !!event.event_name
			});
			return;
		}
		logger.debug('Event validation passed');

		// Add timestamp if not provided
		if (!event.timestamp) {
			event.timestamp = Date.now();
			logger.debug('Added timestamp to event', { timestamp: event.timestamp });
		}

		// Generate eventId if not provided
		if (!event.eventId) {
			event.eventId = `${event.customer_id}_${event.timestamp}_${Math.random().toString(36).substring(7)}`;
			logger.debug('Generated eventId', { eventId: event.eventId });
		}

		try {
			logger.debug('Pushing event to Redis queue');
			await redis.rpush(keys.pendingEvents, JSON.stringify(event));
			logger.debug('Event pushed to Redis successfully');
			
			// Update stats
			logger.debug('Updating total_events stat');
			await this.incrementStat('total_events');
			logger.debug('Stats updated successfully');
			
			logger.debug('Usage event queued', { 
				eventId: event.eventId,
				customer_id: event.customer_id,
				feature_id: event.feature_id,
				event_name: event.event_name,
			});
		} catch (error) {
			logger.error('Failed to queue usage event', { error, event, keys });
			throw error;
		}
	}

	private async incrementStat(statName: string, value = 1): Promise<void> {
		logger.debug('incrementStat() called', { statName, value });
		const keys = this.getRedisKeys();
		
		try {
			const statsStr = await redis.get(keys.stats);
			logger.debug('Retrieved stats from Redis', { hasStats: !!statsStr });
			
			if (statsStr) {
				const stats = JSON.parse(statsStr);
				const oldValue = stats[statName] || 0;
				stats[statName] = oldValue + value;
				
				logger.debug('Updated stat', { 
					statName, 
					oldValue, 
					newValue: stats[statName], 
					increment: value 
				});
				
				await redis.set(keys.stats, JSON.stringify(stats));
				logger.debug('Stats saved to Redis successfully');
			} else {
				logger.warn('No stats found in Redis when trying to increment', { statName, value });
			}
		} catch (error) {
			logger.error('Failed to increment stat', { error, statName, value, keys });
		}
	}

	private async processBatch(): Promise<void> {
		logger.debug('processBatch() called', { isRunning: this.isRunning });
		
		if (!this.isRunning) {
			logger.debug('Sync engine not running, skipping batch processing');
			return;
		}

		const keys = this.getRedisKeys();
		const batchStartTime = Date.now();
		let batchSize = 0;
		logger.debug('Starting batch processing', { 
			batchStartTime, 
			keys,
			maxBatchSize: this.config.batchSize 
		});

		try {
			// First, retry any failed events
			logger.debug('Retrying failed events...');
			await this.retryFailedEvents();
			logger.debug('Failed events retry completed');

			// Get batch of pending events
			logger.debug('Fetching pending events from Redis', { 
				key: keys.pendingEvents, 
				batchSize: this.config.batchSize 
			});
			const eventStrings = await redis.lpop(keys.pendingEvents, this.config.batchSize);
			
			if (!eventStrings || eventStrings.length === 0) {
				logger.debug('No pending events found, batch processing complete');
				return;
			}

			batchSize = eventStrings.length;
			logger.info('Processing usage events batch', { batchSize });
			logger.debug('Raw event strings fetched', { 
				eventCount: eventStrings.length,
				sampleEvents: eventStrings.slice(0, 3)
			});

			const events: UsageEvent[] = [];
			let parseErrors = 0;
			for (const eventStr of eventStrings) {
				try {
					const parsed = JSON.parse(eventStr);
					events.push(parsed);
					logger.debug('Successfully parsed event', { 
						eventId: parsed.eventId,
						customerId: parsed.customer_id
					});
				} catch (parseError) {
					parseErrors++;
					logger.error('Failed to parse usage event', { parseError, eventStr });
				}
			}
			logger.debug('Event parsing completed', { 
				totalEvents: eventStrings.length,
				successfullyParsed: events.length,
				parseErrors 
			});

			if (events.length === 0) {
				logger.debug('No valid events after parsing, exiting batch processing');
				return;
			}

			// Group events by customer for better API efficiency
			logger.debug('Grouping events by customer');
			const eventsByCustomer = this.groupEventsByCustomer(events);
			const customerIds = Object.keys(eventsByCustomer);
			logger.debug('Events grouped by customer', { 
				customerCount: customerIds.length,
				eventsByCustomer: Object.fromEntries(
					Object.entries(eventsByCustomer).map(([id, evts]) => [id, evts.length])
				)
			});

			// Sync each customer's events to Autumn
			logger.debug('Starting parallel sync to Autumn API');
			const results = await Promise.allSettled(
				Object.entries(eventsByCustomer).map(([customerId, customerEvents]) => {
					logger.debug('Starting sync for customer', { customerId, eventCount: customerEvents.length });
					return this.syncCustomerEvents(customerId, customerEvents);
				})
			);
			logger.debug('All customer syncs completed', { resultCount: results.length });

			// Handle results
			let successCount = 0;
			let failCount = 0;

			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				const customerId = customerIds[i];
				
				if (result.status === 'fulfilled') {
					successCount += result.value;
					logger.debug('Customer sync succeeded', { 
						customerId, 
						eventsSynced: result.value 
					});
				} else {
					failCount++;
					logger.error('Failed to sync customer events', { 
						error: result.reason,
						customerId,
						eventCount: eventsByCustomer[customerId]?.length
					});
				}
			}

			logger.debug('Updating batch statistics', { successCount, failCount });
			// Update stats
			await this.incrementStat('successful_syncs', successCount);
			await this.incrementStat('failed_syncs', failCount);
			
			const processingTime = Date.now() - batchStartTime;
			await this.updateBatchStats(batchSize, processingTime);
			logger.debug('Batch stats updated', { processingTime });

			logger.info('Batch processing completed', {
				batchSize,
				successCount,
				failCount,
				processingTimeMs: processingTime,
			});

		} catch (error) {
			logger.error('Error processing batch', { error, batchSize, keys });
			
			if (batchSize > 0) {
				logger.debug('Incrementing failed_syncs stat due to batch error');
				await this.incrementStat('failed_syncs', 1);
			}
		}
	}

	private groupEventsByCustomer(events: UsageEvent[]): Record<string, UsageEvent[]> {
		logger.debug('groupEventsByCustomer() called', { eventCount: events.length });
		
		const groups: Record<string, UsageEvent[]> = {};
		
		for (const event of events) {
			if (!groups[event.customer_id]) {
				groups[event.customer_id] = [];
				logger.debug('Created new customer group', { customerId: event.customer_id });
			}
			groups[event.customer_id].push(event);
		}
		
		const summary = Object.fromEntries(
			Object.entries(groups).map(([id, evts]) => [id, evts.length])
		);
		logger.debug('Events grouped successfully', { 
			customerCount: Object.keys(groups).length,
			eventsByCustomer: summary
		});
		
		return groups;
	}

	private async syncCustomerEvents(customerId: string, events: UsageEvent[]): Promise<number> {
		logger.debug('syncCustomerEvents() called', { 
			customerId, 
			eventCount: events.length,
			eventIds: events.map(e => e.eventId).slice(0, 5)
		});
		
		let successCount = 0;

		for (const event of events) {
			logger.debug('Processing individual event', {
				customerId,
				eventId: event.eventId,
				feature_id: event.feature_id,
				event_name: event.event_name,
				value: event.value
			});
			
			try {
				let autumnRequest: any = {
					customer_id: customerId,
					value: event.value,
				};
				
				if (event.feature_id) {
					autumnRequest.feature_id = event.feature_id;
					logger.debug('Sending to Autumn with feature_id', { 
						customerId, 
						eventId: event.eventId,
						request: autumnRequest
					});
				} else if (event.event_name) {
					autumnRequest.event_name = event.event_name;
					logger.debug('Sending to Autumn with event_name', { 
						customerId, 
						eventId: event.eventId,
						request: autumnRequest
					});
				}
				
				const autumnResult = await autumn.track(autumnRequest);
				logger.debug('Autumn API response received', {
					customerId,
					eventId: event.eventId,
					result: autumnResult
				});
				
				successCount++;
				logger.debug('Successfully synced usage event to Autumn', {
					customerId,
					eventId: event.eventId,
					feature_id: event.feature_id,
					event_name: event.event_name,
					successCount
				});

			} catch (error) {
				logger.error('Failed to sync usage event to Autumn', {
					error,
					customerId,
					eventId: event.eventId,
					feature_id: event.feature_id,
					event_name: event.event_name,
					errorMessage: error instanceof Error ? error.message : String(error)
				});

				// Queue for retry
				logger.debug('Queueing event for retry', { 
					customerId, 
					eventId: event.eventId 
				});
				await this.queueForRetry(event);
				logger.debug('Event queued for retry successfully');
			}
		}

		logger.debug('syncCustomerEvents() completed', { 
			customerId, 
			totalEvents: events.length, 
			successCount,
			failedCount: events.length - successCount
		});
		
		return successCount;
	}

	private async queueForRetry(event: UsageEvent, retryCount = 0): Promise<void> {
		logger.debug('queueForRetry() called', {
			eventId: event.eventId,
			customerId: event.customer_id,
			retryCount,
			maxRetries: this.config.maxRetries
		});
		
		if (retryCount >= this.config.maxRetries) {
			logger.warn('Event exceeded max retries, moving to failed queue', {
				eventId: event.eventId,
				customerId: event.customer_id,
				retryCount,
				maxRetries: this.config.maxRetries
			});
			
			// Move to failed events
			const keys = this.getRedisKeys();
			const failedEvent = {
				...event,
				failed_at: Date.now(),
				retry_count: retryCount,
			};
			
			try {
				await redis.rpush(keys.failedEvents, JSON.stringify(failedEvent));
				logger.debug('Event moved to failed queue successfully', {
					eventId: event.eventId,
					failedQueue: keys.failedEvents
				});
			} catch (error) {
				logger.error('Failed to move event to failed queue', {
					error,
					eventId: event.eventId,
					keys
				});
			}
			return;
		}

		const keys = this.getRedisKeys();
		const backoffDelayMs = this.config.retryDelayMs * Math.pow(2, retryCount);
		const retryAt = Date.now() + backoffDelayMs;
		
		const retryEvent = {
			...event,
			retry_count: retryCount,
			retry_at: retryAt,
		};
		
		logger.debug('Queueing event for retry with exponential backoff', {
			eventId: event.eventId,
			customerId: event.customer_id,
			retryCount,
			backoffDelayMs,
			retryAt: new Date(retryAt).toISOString()
		});

		try {
			await redis.rpush(keys.retryQueue, JSON.stringify(retryEvent));
			logger.debug('Event queued for retry successfully', {
				eventId: event.eventId,
				retryQueue: keys.retryQueue
			});
		} catch (error) {
			logger.error('Failed to queue event for retry', {
				error,
				eventId: event.eventId,
				keys
			});
			throw error;
		}
	}

	private async retryFailedEvents(): Promise<void> {
		logger.debug('retryFailedEvents() called');
		const keys = this.getRedisKeys();
		const currentTime = Date.now();
		
		logger.debug('Fetching retry events', { 
			retryQueue: keys.retryQueue,
			currentTime: new Date(currentTime).toISOString()
		});
		
		// Get all retry events
		const retryEventStrings = await redis.lrange(keys.retryQueue, 0, -1);
		logger.debug('Retry events fetched', { 
			count: retryEventStrings.length,
			sample: retryEventStrings.slice(0, 2)
		});
		
		if (retryEventStrings.length === 0) {
			logger.debug('No retry events found, skipping retry processing');
			return;
		}

		const eventsToRetry: UsageEvent[] = [];
		const eventsToKeep: string[] = [];
		let parseErrors = 0;

		for (const eventStr of retryEventStrings) {
			try {
				const event = JSON.parse(eventStr);
				logger.debug('Processing retry event', {
					eventId: event.eventId,
					retryAt: event.retry_at ? new Date(event.retry_at).toISOString() : 'undefined',
					readyForRetry: event.retry_at && event.retry_at <= currentTime
				});
				
				if (event.retry_at && event.retry_at <= currentTime) {
					eventsToRetry.push(event);
					logger.debug('Event marked for retry', { eventId: event.eventId });
				} else {
					eventsToKeep.push(eventStr);
					logger.debug('Event not ready for retry yet', {
						eventId: event.eventId,
						retryAt: event.retry_at ? new Date(event.retry_at).toISOString() : 'undefined'
					});
				}
			} catch (error) {
				parseErrors++;
				logger.error('Failed to parse retry event', { error, eventStr });
			}
		}
		
		logger.debug('Retry event analysis completed', {
			total: retryEventStrings.length,
			toRetry: eventsToRetry.length,
			toKeep: eventsToKeep.length,
			parseErrors
		});

		if (eventsToRetry.length > 0) {
			logger.debug('Updating retry queue with remaining events');
			
			// Clear retry queue and add back events that shouldn't be retried yet
			await redis.del(keys.retryQueue);
			logger.debug('Retry queue cleared');
			
			if (eventsToKeep.length > 0) {
				await redis.rpush(keys.retryQueue, ...eventsToKeep);
				logger.debug('Events not ready for retry added back to queue', {
					count: eventsToKeep.length
				});
			}

			// Retry events
			logger.debug('Starting retry processing', { eventCount: eventsToRetry.length });
			let retrySuccessCount = 0;
			let retryFailCount = 0;
			
			for (const event of eventsToRetry) {
				logger.debug('Retrying event', {
					eventId: event.eventId,
					customerId: event.customer_id,
					retryCount: event.retry_count
				});
				
				try {
					const customerId = event.customer_id;
					const syncResult = await this.syncCustomerEvents(customerId, [event]);
					
					if (syncResult > 0) {
						retrySuccessCount++;
						logger.debug('Event retry succeeded', {
							eventId: event.eventId,
							customerId
						});
					} else {
						retryFailCount++;
						logger.debug('Event retry failed with no events synced', {
							eventId: event.eventId,
							customerId
						});
						
						// Queue for another retry
						const retryCount = (event.retry_count || 0) + 1;
						await this.queueForRetry(event, retryCount);
					}
				} catch (error) {
					retryFailCount++;
					logger.error('Error during event retry', {
						error,
						eventId: event.eventId,
						customerId: event.customer_id
					});
					
					// Queue for another retry
					const retryCount = (event.retry_count || 0) + 1;
					await this.queueForRetry(event, retryCount);
				}
			}
			
			logger.debug('Retry processing completed', {
				totalRetried: eventsToRetry.length,
				successCount: retrySuccessCount,
				failCount: retryFailCount
			});
		} else {
			logger.debug('No events ready for retry');
		}
	}

	private async updateBatchStats(batchSize: number, processingTime: number): Promise<void> {
		logger.debug('updateBatchStats() called', { batchSize, processingTime });
		const keys = this.getRedisKeys();
		
		try {
			const statsStr = await redis.get(keys.stats);
			logger.debug('Retrieved current stats', { hasStats: !!statsStr });
			
			if (statsStr) {
				const stats = JSON.parse(statsStr);
				const oldBatchTime = stats.last_batch_time;
				const oldBatchSize = stats.last_batch_size;
				
				stats.last_batch_time = processingTime;
				stats.last_batch_size = batchSize;
				
				logger.debug('Updating batch stats', {
					oldBatchTime,
					newBatchTime: processingTime,
					oldBatchSize,
					newBatchSize: batchSize
				});
				
				await redis.set(keys.stats, JSON.stringify(stats));
				logger.debug('Batch stats updated in Redis');
			} else {
				logger.warn('No stats found when trying to update batch stats');
			}
			
			const syncTime = Date.now();
			await redis.set(keys.lastSyncTime, syncTime.toString());
			logger.debug('Last sync time updated', { 
				lastSyncTime: new Date(syncTime).toISOString(),
				key: keys.lastSyncTime
			});
		} catch (error) {
			logger.error('Failed to update batch stats', { error, batchSize, processingTime, keys });
		}
	}

	async getStats(): Promise<any> {
		logger.debug('getStats() called');
		const keys = this.getRedisKeys();
		logger.debug('Getting stats with keys', { keys });
		
		try {
			const [statsStr, pendingCount, failedCount, retryCount, lastSyncStr] = await Promise.all([
				redis.get(keys.stats),
				redis.llen(keys.pendingEvents),
				redis.llen(keys.failedEvents),
				redis.llen(keys.retryQueue),
				redis.get(keys.lastSyncTime),
			]);
			logger.debug('Raw stats data retrieved', {
				hasStatsStr: !!statsStr,
				pendingCount,
				failedCount,
				retryCount,
				lastSyncStr
			});

			const stats = statsStr ? JSON.parse(statsStr) : {};
			logger.debug('Parsed stats', { stats });
			
			const result = {
				...stats,
				pending_events: pendingCount,
				failed_events: failedCount,
				retry_queue_size: retryCount,
				last_sync_time: lastSyncStr ? parseInt(lastSyncStr) : null,
				is_running: this.isRunning,
				config: this.config,
			};
			logger.debug('Stats result prepared', { result });
			
			return result;
		} catch (error) {
			logger.error('Failed to get stats', { error, keys });
			return {
				error: 'Failed to retrieve stats',
				is_running: this.isRunning,
			};
		}
	}

	async clearFailedEvents(): Promise<number> {
		logger.debug('clearFailedEvents() called');
		const keys = this.getRedisKeys();
		logger.debug('Getting failed events count', { failedEventsKey: keys.failedEvents });
		
		try {
			const count = await redis.llen(keys.failedEvents);
			logger.debug('Failed events count retrieved', { count });
			
			if (count > 0) {
				logger.debug('Deleting failed events');
				await redis.del(keys.failedEvents);
				logger.info('Cleared failed events', { count });
			} else {
				logger.debug('No failed events to clear');
			}
			
			return count;
		} catch (error) {
			logger.error('Failed to clear failed events', { error, keys });
			throw error;
		}
	}

	async reprocessFailedEvents(): Promise<void> {
		logger.debug('reprocessFailedEvents() called');
		const keys = this.getRedisKeys();
		logger.debug('Starting to reprocess failed events', { failedEventsKey: keys.failedEvents });
		
		// Move all failed events back to pending
		let movedCount = 0;
		let parseErrors = 0;
		let event: string | null;
		
		while ((event = await redis.lpop(keys.failedEvents))) {
			logger.debug('Processing failed event for requeue', { eventPreview: event.slice(0, 100) });
			
			try {
				const eventData = JSON.parse(event);
				logger.debug('Parsed failed event', {
					eventId: eventData.eventId,
					customerId: eventData.customer_id,
					hadFailedAt: !!eventData.failed_at,
					retryCount: eventData.retry_count
				});
				
				// Remove retry metadata and requeue
				delete eventData.failed_at;
				delete eventData.retry_count;
				delete eventData.retry_at;
				
				await redis.rpush(keys.pendingEvents, JSON.stringify(eventData));
				movedCount++;
				logger.debug('Failed event requeued successfully', {
					eventId: eventData.eventId,
					movedCount
				});
			} catch (error) {
				parseErrors++;
				logger.error('Failed to reprocess failed event', { error, event, parseErrors });
			}
		}
		
		logger.info('Requeued failed events for processing', { movedCount, parseErrors });
		logger.debug('reprocessFailedEvents() completed', {
			totalMoved: movedCount,
			parseErrors,
			pendingQueue: keys.pendingEvents
		});
	}

	async triggerImmediateProcessing(): Promise<void> {
		logger.debug('triggerImmediateProcessing() called', { isRunning: this.isRunning });
		
		if (!this.isRunning) {
			logger.error('Cannot trigger immediate processing - sync engine is not running');
			throw new Error('Sync engine is not running');
		}
		
		logger.info('Triggering immediate batch processing');
		try {
			await this.processBatch();
			logger.debug('Immediate processing completed successfully');
		} catch (error) {
			logger.error('Error during immediate processing', { error });
			throw error;
		}
	}
}

// Export a default instance
export const usageSyncEngine = new UsageSyncEngine();