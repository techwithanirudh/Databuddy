import { describe, expect, it, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { redis } from '@databuddy/redis';
import { Autumn as autumn } from 'autumn-js';
import { UsageSyncEngine } from './usage-sync-engine';
import { logger } from './logger';

// Mock dependencies
vi.mock('@databuddy/redis', () => ({
	redis: {
		get: vi.fn(),
		set: vi.fn(),
		rpush: vi.fn(),
		lpop: vi.fn(),
		llen: vi.fn(),
		del: vi.fn(),
		lrange: vi.fn(),
	},
}));

vi.mock('autumn-js', () => ({
	Autumn: {
		track: vi.fn(),
	},
}));

vi.mock('./logger', () => ({
	logger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

describe('UsageSyncEngine', () => {
	let syncEngine: UsageSyncEngine;
	let mockRedis: any;
	let mockAutumn: MockedFunction<typeof autumn.track>;
	let mockLogger: any;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();
		
		// Setup mock implementations
		mockRedis = redis;
		mockAutumn = autumn.track as MockedFunction<typeof autumn.track>;
		mockLogger = logger;

		// Create fresh instance for each test
		syncEngine = new UsageSyncEngine({
			batchSize: 10,
			syncIntervalMs: 1000,
			maxRetries: 2,
			retryDelayMs: 100,
			redisKeyPrefix: 'test:usage:sync',
		});

		// Default mock implementations
		mockRedis.get.mockResolvedValue(null);
		mockRedis.set.mockResolvedValue(null);
		mockRedis.rpush.mockResolvedValue(1);
		mockRedis.lpop.mockResolvedValue(null);
		mockRedis.llen.mockResolvedValue(0);
		mockRedis.del.mockResolvedValue(1);
		mockRedis.lrange.mockResolvedValue([]);
		mockAutumn.mockResolvedValue({ message: 'Event recorded successfully' });
	});

	afterEach(async () => {
		// Clean up any running sync engines
		try {
			await syncEngine.stop();
		} catch (error) {
			// Ignore cleanup errors
		}
	});

	describe('constructor', () => {
		it('should initialize with default config', () => {
			const engine = new UsageSyncEngine();
			expect(engine).toBeDefined();
		});

		it('should initialize with custom config', () => {
			const config = {
				batchSize: 50,
				syncIntervalMs: 5000,
				maxRetries: 5,
				retryDelayMs: 2000,
				redisKeyPrefix: 'custom:prefix',
			};
			const engine = new UsageSyncEngine(config);
			expect(engine).toBeDefined();
		});
	});

	describe('start', () => {
		it('should start the sync engine successfully', async () => {
			mockRedis.get.mockResolvedValue(null); // No existing stats
			
			await syncEngine.start();
			
			expect(mockLogger.info).toHaveBeenCalledWith('Starting usage sync engine', expect.any(Object));
			expect(mockLogger.debug).toHaveBeenCalledWith('start() called', { isRunning: false });
			expect(mockRedis.set).toHaveBeenCalled(); // For initializing stats
		});

		it('should not start if already running', async () => {
			await syncEngine.start();
			
			// Try to start again
			await syncEngine.start();
			
			expect(mockLogger.warn).toHaveBeenCalledWith('Usage sync engine is already running');
		});

		it('should handle initialization errors', async () => {
			const error = new Error('Redis connection failed');
			mockRedis.set.mockRejectedValue(error);
			
			await expect(syncEngine.start()).rejects.toThrow('Redis connection failed');
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to start usage sync engine', expect.any(Object));
		});
	});

	describe('stop', () => {
		it('should stop the sync engine successfully', async () => {
			await syncEngine.start();
			mockRedis.lpop.mockResolvedValue(null); // No pending events
			
			await syncEngine.stop();
			
			expect(mockLogger.info).toHaveBeenCalledWith('Usage sync engine stopped');
			expect(mockLogger.debug).toHaveBeenCalledWith('stop() called', { isRunning: false });
		});

		it('should do nothing if not running', async () => {
			await syncEngine.stop();
			
			expect(mockLogger.debug).toHaveBeenCalledWith('Sync engine is not running, nothing to stop');
		});
	});

	describe('queueUsageEvent', () => {
		beforeEach(async () => {
			mockRedis.get.mockResolvedValue('{"total_events": 0}');
			await syncEngine.start();
		});

		it('should queue a valid event with feature_id', async () => {
			const event = {
				customer_id: 'user-123',
				feature_id: 'api-calls',
				value: 1,
				timestamp: Date.now(),
			};

			await syncEngine.queueUsageEvent(event);

			expect(mockRedis.rpush).toHaveBeenCalledWith(
				'test:usage:sync:pending',
				expect.stringContaining('user-123')
			);
			expect(mockLogger.debug).toHaveBeenCalledWith('Usage event queued', expect.any(Object));
		});

		it('should queue a valid event with event_name', async () => {
			const event = {
				customer_id: 'user-123',
				event_name: 'custom_action',
				value: 1,
				timestamp: Date.now(),
			};

			await syncEngine.queueUsageEvent(event);

			expect(mockRedis.rpush).toHaveBeenCalledWith(
				'test:usage:sync:pending',
				expect.stringContaining('user-123')
			);
		});

		it('should reject event without customer_id', async () => {
			const event = {
				customer_id: '',
				feature_id: 'api-calls',
				value: 1,
				timestamp: Date.now(),
			};

			await syncEngine.queueUsageEvent(event);

			expect(mockRedis.rpush).not.toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalledWith(
				'Invalid usage event: missing required fields',
				expect.any(Object)
			);
		});

		it('should reject event without feature_id or event_name', async () => {
			const event = {
				customer_id: 'user-123',
				value: 1,
				timestamp: Date.now(),
			};

			await syncEngine.queueUsageEvent(event);

			expect(mockRedis.rpush).not.toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalledWith(
				'Invalid usage event: missing required fields',
				expect.any(Object)
			);
		});

		it('should add timestamp if not provided', async () => {
			const event = {
				customer_id: 'user-123',
				feature_id: 'api-calls',
				value: 1,
			};

			await syncEngine.queueUsageEvent(event);

			expect(mockRedis.rpush).toHaveBeenCalled();
			const queuedEventStr = (mockRedis.rpush as any).mock.calls[0][1];
			const queuedEvent = JSON.parse(queuedEventStr);
			expect(queuedEvent.timestamp).toBeDefined();
		});

		it('should generate eventId if not provided', async () => {
			const event = {
				customer_id: 'user-123',
				feature_id: 'api-calls',
				value: 1,
				timestamp: Date.now(),
			};

			await syncEngine.queueUsageEvent(event);

			const queuedEventStr = (mockRedis.rpush as any).mock.calls[0][1];
			const queuedEvent = JSON.parse(queuedEventStr);
			expect(queuedEvent.eventId).toBeDefined();
			expect(queuedEvent.eventId).toContain('user-123');
		});

		it('should handle Redis errors', async () => {
			const error = new Error('Redis write failed');
			mockRedis.rpush.mockRejectedValue(error);

			const event = {
				customer_id: 'user-123',
				feature_id: 'api-calls',
				value: 1,
				timestamp: Date.now(),
			};

			await expect(syncEngine.queueUsageEvent(event)).rejects.toThrow('Redis write failed');
			expect(mockLogger.error).toHaveBeenCalledWith(
				'Failed to queue usage event',
				expect.any(Object)
			);
		});
	});

	describe('processBatch', () => {
		beforeEach(async () => {
			mockRedis.get.mockResolvedValue('{"total_events": 0}');
			await syncEngine.start();
		});

		it('should process empty batch', async () => {
			mockRedis.lrange.mockResolvedValue([]); // No retry events
			mockRedis.lpop.mockResolvedValue(null); // No pending events

			await syncEngine.triggerImmediateProcessing();

			expect(mockLogger.debug).toHaveBeenCalledWith('No pending events found, batch processing complete');
		});

		it('should process batch with valid events', async () => {
			const events = [
				JSON.stringify({
					customer_id: 'user-123',
					feature_id: 'api-calls',
					value: 1,
					eventId: 'event-1',
					timestamp: Date.now(),
				}),
				JSON.stringify({
					customer_id: 'user-456',
					event_name: 'custom_action',
					value: 2,
					eventId: 'event-2',
					timestamp: Date.now(),
				}),
			];

			mockRedis.lrange.mockResolvedValue([]);
			mockRedis.lpop.mockResolvedValue(events);
			mockAutumn.mockResolvedValue({ message: 'Event recorded successfully' });

			await syncEngine.triggerImmediateProcessing();

			expect(mockAutumn).toHaveBeenCalledTimes(2);
			expect(mockAutumn).toHaveBeenCalledWith({
				customer_id: 'user-123',
				feature_id: 'api-calls',
				value: 1,
			});
			expect(mockAutumn).toHaveBeenCalledWith({
				customer_id: 'user-456',
				event_name: 'custom_action',
				value: 2,
			});
			expect(mockLogger.info).toHaveBeenCalledWith('Batch processing completed', expect.any(Object));
		});

		it('should handle parsing errors', async () => {
			const events = [
				'invalid-json',
				JSON.stringify({
					customer_id: 'user-123',
					feature_id: 'api-calls',
					value: 1,
					timestamp: Date.now(),
				}),
			];

			mockRedis.lrange.mockResolvedValue([]);
			mockRedis.lpop.mockResolvedValue(events);

			await syncEngine.triggerImmediateProcessing();

			expect(mockLogger.error).toHaveBeenCalledWith(
				'Failed to parse usage event',
				expect.any(Object)
			);
			expect(mockAutumn).toHaveBeenCalledTimes(1); // Only valid event processed
		});

		it('should handle Autumn API errors', async () => {
			const events = [
				JSON.stringify({
					customer_id: 'user-123',
					feature_id: 'api-calls',
					value: 1,
					eventId: 'event-1',
					timestamp: Date.now(),
				}),
			];

			mockRedis.lrange.mockResolvedValue([]);
			mockRedis.lpop.mockResolvedValue(events);
			mockAutumn.mockRejectedValue(new Error('API Error'));

			await syncEngine.triggerImmediateProcessing();

			expect(mockLogger.error).toHaveBeenCalledWith(
				'Failed to sync usage event to Autumn',
				expect.any(Object)
			);
			expect(mockRedis.rpush).toHaveBeenCalledWith(
				'test:usage:sync:retry',
				expect.any(String)
			); // Event queued for retry
		});

		it('should group events by customer', async () => {
			const events = [
				JSON.stringify({
					customer_id: 'user-123',
					feature_id: 'api-calls',
					value: 1,
					eventId: 'event-1',
					timestamp: Date.now(),
				}),
				JSON.stringify({
					customer_id: 'user-123',
					feature_id: 'storage',
					value: 2,
					eventId: 'event-2',
					timestamp: Date.now(),
				}),
			];

			mockRedis.lrange.mockResolvedValue([]);
			mockRedis.lpop.mockResolvedValue(events);

			await syncEngine.triggerImmediateProcessing();

			expect(mockLogger.debug).toHaveBeenCalledWith('Events grouped by customer', 
				expect.objectContaining({
					customerCount: 1,
					eventsByCustomer: { 'user-123': 2 }
				})
			);
		});
	});

	describe('retry mechanism', () => {
		beforeEach(async () => {
			mockRedis.get.mockResolvedValue('{"total_events": 0}');
			await syncEngine.start();
		});

		it('should retry failed events', async () => {
			const currentTime = Date.now();
			const retryEvents = [
				JSON.stringify({
					customer_id: 'user-123',
					feature_id: 'api-calls',
					value: 1,
					eventId: 'event-1',
					timestamp: currentTime - 1000,
					retry_count: 0,
					retry_at: currentTime - 100, // Ready for retry
				}),
			];

			mockRedis.lrange.mockResolvedValue(retryEvents);
			mockRedis.lpop.mockResolvedValue(null); // No new pending events
			mockAutumn.mockResolvedValue({ message: 'Event recorded successfully' });

			await syncEngine.triggerImmediateProcessing();

			expect(mockRedis.del).toHaveBeenCalledWith('test:usage:sync:retry');
			expect(mockAutumn).toHaveBeenCalledWith({
				customer_id: 'user-123',
				feature_id: 'api-calls',
				value: 1,
			});
		});

		it('should keep events not ready for retry', async () => {
			const currentTime = Date.now();
			const retryEvents = [
				JSON.stringify({
					customer_id: 'user-123',
					feature_id: 'api-calls',
					value: 1,
					eventId: 'event-1',
					timestamp: currentTime - 1000,
					retry_count: 0,
					retry_at: currentTime + 1000, // Not ready for retry
				}),
			];

			mockRedis.lrange.mockResolvedValue(retryEvents);
			mockRedis.lpop.mockResolvedValue(null);

			await syncEngine.triggerImmediateProcessing();

			expect(mockRedis.rpush).toHaveBeenCalledWith(
				'test:usage:sync:retry',
				retryEvents[0]
			);
			expect(mockAutumn).not.toHaveBeenCalled();
		});

		it('should move to failed queue after max retries', async () => {
			const event = {
				customer_id: 'user-123',
				feature_id: 'api-calls',
				value: 1,
				eventId: 'event-1',
				timestamp: Date.now(),
			};

			// Mock queueForRetry to test max retries
			await syncEngine.queueUsageEvent(event);
			
			// Simulate reaching max retries
			const retryEvent = { ...event, retry_count: 2 }; // Max retries = 2
			
			// This should move to failed queue
			await (syncEngine as any).queueForRetry(retryEvent, 2);

			expect(mockRedis.rpush).toHaveBeenCalledWith(
				'test:usage:sync:failed',
				expect.stringContaining('failed_at')
			);
		});
	});

	describe('stats', () => {
		beforeEach(async () => {
			mockRedis.get.mockResolvedValue('{"total_events": 10, "successful_syncs": 5}');
			await syncEngine.start();
		});

		it('should get comprehensive stats', async () => {
			mockRedis.llen.mockImplementation((key: string) => {
				if (key.includes('pending')) return Promise.resolve(3);
				if (key.includes('failed')) return Promise.resolve(1);
				if (key.includes('retry')) return Promise.resolve(2);
				return Promise.resolve(0);
			});
			mockRedis.get.mockImplementation((key: string) => {
				if (key.includes('stats')) return Promise.resolve('{"total_events": 100}');
				if (key.includes('last_sync')) return Promise.resolve('1234567890');
				return Promise.resolve(null);
			});

			const stats = await syncEngine.getStats();

			expect(stats).toEqual(expect.objectContaining({
				total_events: 100,
				pending_events: 3,
				failed_events: 1,
				retry_queue_size: 2,
				last_sync_time: 1234567890,
				is_running: true,
				config: expect.any(Object),
			}));
		});

		it('should handle stats retrieval errors', async () => {
			mockRedis.get.mockRejectedValue(new Error('Redis error'));

			const stats = await syncEngine.getStats();

			expect(stats).toEqual({
				error: 'Failed to retrieve stats',
				is_running: true,
			});
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to get stats', expect.any(Object));
		});
	});

	describe('failed events management', () => {
		beforeEach(async () => {
			mockRedis.get.mockResolvedValue('{"total_events": 0}');
			await syncEngine.start();
		});

		it('should clear failed events', async () => {
			mockRedis.llen.mockResolvedValue(5);

			const clearedCount = await syncEngine.clearFailedEvents();

			expect(clearedCount).toBe(5);
			expect(mockRedis.del).toHaveBeenCalledWith('test:usage:sync:failed');
			expect(mockLogger.info).toHaveBeenCalledWith('Cleared failed events', { count: 5 });
		});

		it('should reprocess failed events', async () => {
			const failedEvents = [
				JSON.stringify({
					customer_id: 'user-123',
					feature_id: 'api-calls',
					value: 1,
					eventId: 'event-1',
					failed_at: Date.now(),
					retry_count: 3,
				}),
			];

			mockRedis.lpop.mockImplementation((key: string) => {
				if (key.includes('failed')) {
					const event = failedEvents.shift();
					return Promise.resolve(event || null);
				}
				return Promise.resolve(null);
			});

			await syncEngine.reprocessFailedEvents();

			expect(mockRedis.rpush).toHaveBeenCalledWith(
				'test:usage:sync:pending',
				expect.not.stringContaining('failed_at')
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				'Requeued failed events for processing',
				expect.objectContaining({ movedCount: 1 })
			);
		});
	});

	describe('immediate processing', () => {
		it('should trigger immediate processing when running', async () => {
			mockRedis.get.mockResolvedValue('{"total_events": 0}');
			await syncEngine.start();
			mockRedis.lpop.mockResolvedValue(null);

			await syncEngine.triggerImmediateProcessing();

			expect(mockLogger.info).toHaveBeenCalledWith('Triggering immediate batch processing');
		});

		it('should throw error when not running', async () => {
			await expect(syncEngine.triggerImmediateProcessing()).rejects.toThrow(
				'Sync engine is not running'
			);
		});
	});

	describe('configuration', () => {
		it('should use exponential backoff for retries', async () => {
			const engine = new UsageSyncEngine({
				retryDelayMs: 1000,
			});

			await engine.start();

			const event = {
				customer_id: 'user-123',
				feature_id: 'api-calls',
				value: 1,
				eventId: 'event-1',
				timestamp: Date.now(),
			};

			// Test first retry (1000ms delay)
			await (engine as any).queueForRetry(event, 0);
			let retryEventStr = (mockRedis.rpush as any).mock.calls[0][1];
			let retryEvent = JSON.parse(retryEventStr);
			let expectedDelay = 1000 * Math.pow(2, 0); // 1000ms
			expect(retryEvent.retry_at).toBeCloseTo(Date.now() + expectedDelay, -2);

			// Reset mock
			mockRedis.rpush.mockClear();

			// Test second retry (2000ms delay)
			await (engine as any).queueForRetry(event, 1);
			retryEventStr = (mockRedis.rpush as any).mock.calls[0][1];
			retryEvent = JSON.parse(retryEventStr);
			expectedDelay = 1000 * Math.pow(2, 1); // 2000ms
			expect(retryEvent.retry_at).toBeCloseTo(Date.now() + expectedDelay, -2);

			await engine.stop();
		});
	});
});