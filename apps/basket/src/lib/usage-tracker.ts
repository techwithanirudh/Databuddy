import { logger } from './logger';
import { usageSyncEngine } from './usage-sync-engine';

interface EventToUsageMapping {
	eventName: string;
	featureId?: string;
	eventNameForAutumn?: string;
	valueCalculator?: (eventData: any) => number;
	customerIdExtractor?: (eventData: any, clientId: string, ownerId?: string) => string | null;
}

// Configuration for mapping analytics events to usage tracking
const EVENT_MAPPINGS: EventToUsageMapping[] = [
	{
		eventName: 'track',
		featureId: 'events',
		valueCalculator: () => 1, // Each tracking event counts as 1
		customerIdExtractor: (eventData, clientId, ownerId) => ownerId || clientId,
	},
	{
		eventName: 'error',
		featureId: 'events',
		valueCalculator: () => 1,
		customerIdExtractor: (eventData, clientId, ownerId) => ownerId || clientId,
	},
	{
		eventName: 'web_vitals',
		featureId: 'events',
		valueCalculator: () => 1,
		customerIdExtractor: (eventData, clientId, ownerId) => ownerId || clientId,
	},
	{
		eventName: 'custom',
		eventNameForAutumn: 'custom_events',
		valueCalculator: () => 1,
		customerIdExtractor: (eventData, clientId, ownerId) => ownerId || clientId,
	},
	{
		eventName: 'outgoing_link',
		eventNameForAutumn: 'link_clicks',
		valueCalculator: () => 1,
		customerIdExtractor: (eventData, clientId, ownerId) => ownerId || clientId,
	},
];

export class UsageTracker {
	private isEnabled: boolean;

	constructor(enabled = true) {
		this.isEnabled = enabled;
	}

	async trackEventUsage(
		eventType: string,
		eventData: any,
		clientId: string,
		ownerId?: string
	): Promise<void> {
		logger.debug('trackEventUsage() called', {
			eventType,
			clientId,
			ownerId,
			isEnabled: this.isEnabled,
			eventDataKeys: eventData ? Object.keys(eventData) : []
		});
		
		if (!this.isEnabled) {
			logger.debug('Usage tracker is disabled, skipping event tracking');
			return;
		}

		// Don't track usage if no ownerId (free tier or invalid user)
		if (!ownerId) {
			logger.debug('No ownerId provided, skipping usage tracking (likely free tier)');
			return;
		}

		try {
			logger.debug('Looking for event mapping', { 
				eventType,
				availableMappings: EVENT_MAPPINGS.map(m => m.eventName)
			});
			
			const mapping = EVENT_MAPPINGS.find(m => m.eventName === eventType);
			if (!mapping) {
				logger.debug('No usage mapping found for event type', { eventType });
				return;
			}
			logger.debug('Found event mapping', {
				eventType,
				mapping: {
					featureId: mapping.featureId,
					eventNameForAutumn: mapping.eventNameForAutumn,
					hasValueCalculator: !!mapping.valueCalculator,
					hasCustomerIdExtractor: !!mapping.customerIdExtractor
				}
			});

			logger.debug('Extracting customer ID');
			const customerId = mapping.customerIdExtractor?.(eventData, clientId, ownerId);
			if (!customerId) {
				logger.debug('No customer ID extracted for usage tracking', { 
					eventType, 
					clientId, 
					ownerId,
					extractorResult: customerId
				});
				return;
			}
			logger.debug('Customer ID extracted successfully', { customerId });

			logger.debug('Calculating event value');
			const value = mapping.valueCalculator?.(eventData) || 1;
			logger.debug('Event value calculated', { value });

			const usageEvent = {
				customer_id: customerId,
				feature_id: mapping.featureId,
				event_name: mapping.eventNameForAutumn,
				value,
				timestamp: Date.now(),
				metadata: {
					event_type: eventType,
					client_id: clientId,
					source: 'basket',
				},
			};
			logger.debug('Queueing usage event to sync engine', { usageEvent });
			
			await usageSyncEngine.queueUsageEvent(usageEvent);
			logger.debug('Usage event queued successfully');

			logger.debug('Usage event queued', {
				eventType,
				customerId,
				featureId: mapping.featureId,
				eventName: mapping.eventNameForAutumn,
				value,
			});

		} catch (error) {
			logger.error('Failed to track event usage', {
				error,
				eventType,
				clientId,
				ownerId,
				errorMessage: error instanceof Error ? error.message : String(error)
			});
		}
	}

	async trackBatchUsage(
		events: Array<{
			eventType: string;
			eventData: any;
			clientId: string;
			ownerId?: string;
		}>
	): Promise<void> {
		logger.debug('trackBatchUsage() called', {
			batchSize: events.length,
			isEnabled: this.isEnabled,
			eventTypes: events.map(e => e.eventType).slice(0, 10)
		});
		
		if (!this.isEnabled) {
			logger.debug('Usage tracker is disabled, skipping batch tracking');
			return;
		}
		
		if (events.length === 0) {
			logger.debug('No events to track in batch');
			return;
		}

		logger.debug('Starting parallel batch tracking', { eventCount: events.length });
		const trackingPromises = events.map(({ eventType, eventData, clientId, ownerId }, index) => {
			logger.debug('Creating tracking promise for batch event', {
				index,
				eventType,
				clientId,
				ownerId
			});
			return this.trackEventUsage(eventType, eventData, clientId, ownerId);
		});

		try {
			const results = await Promise.allSettled(trackingPromises);
			const fulfilled = results.filter(r => r.status === 'fulfilled').length;
			const rejected = results.filter(r => r.status === 'rejected').length;
			
			logger.debug('Batch usage tracking completed', {
				total: events.length,
				fulfilled,
				rejected
			});
			
			if (rejected > 0) {
				const rejectedReasons = results
					.filter(r => r.status === 'rejected')
					.map(r => (r as PromiseRejectedResult).reason)
					.slice(0, 3);
				logger.warn('Some batch tracking events failed', {
					rejectedCount: rejected,
					sampleReasons: rejectedReasons
				});
			}
		} catch (error) {
			logger.error('Error in batch usage tracking', { 
				error, 
				batchSize: events.length,
				errorMessage: error instanceof Error ? error.message : String(error)
			});
		}
	}

	async trackCustomUsage(
		customerId: string,
		featureId?: string,
		eventName?: string,
		value = 1,
		metadata?: Record<string, any>
	): Promise<void> {
		logger.debug('trackCustomUsage() called', {
			customerId,
			featureId,
			eventName,
			value,
			isEnabled: this.isEnabled,
			metadataKeys: metadata ? Object.keys(metadata) : []
		});
		
		if (!this.isEnabled) {
			logger.debug('Usage tracker is disabled, skipping custom usage tracking');
			return;
		}
		
		if (!customerId) {
			logger.error('Cannot track custom usage without customerId');
			return;
		}
		
		if (!featureId && !eventName) {
			logger.error('Cannot track custom usage without featureId or eventName');
			return;
		}

		try {
			const usageEvent = {
				customer_id: customerId,
				feature_id: featureId,
				event_name: eventName,
				value,
				timestamp: Date.now(),
				metadata: {
					...metadata,
					source: 'custom',
				},
			};
			logger.debug('Queueing custom usage event', { usageEvent });
			
			await usageSyncEngine.queueUsageEvent(usageEvent);
			logger.debug('Custom usage event queued successfully');

			logger.debug('Custom usage event queued', {
				customerId,
				featureId,
				eventName,
				value,
			});

		} catch (error) {
			logger.error('Failed to track custom usage', {
				error,
				customerId,
				featureId,
				eventName,
				value,
				errorMessage: error instanceof Error ? error.message : String(error)
			});
		}
	}

	enable(): void {
		logger.debug('enable() called', { currentState: this.isEnabled });
		this.isEnabled = true;
		logger.info('Usage tracker enabled');
	}

	disable(): void {
		logger.debug('disable() called', { currentState: this.isEnabled });
		this.isEnabled = false;
		logger.info('Usage tracker disabled');
	}

	isTrackingEnabled(): boolean {
		logger.debug('isTrackingEnabled() called', { isEnabled: this.isEnabled });
		return this.isEnabled;
	}
}

// Export a default instance
export const usageTracker = new UsageTracker(
	process.env.USAGE_TRACKING_ENABLED !== 'false' // Enabled by default, can be disabled via env
);