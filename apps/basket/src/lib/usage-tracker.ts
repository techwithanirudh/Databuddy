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
		if (!this.isEnabled) {
			return;
		}

		// Don't track usage if no ownerId (free tier or invalid user)
		if (!ownerId) {
			return;
		}

		try {
			const mapping = EVENT_MAPPINGS.find(m => m.eventName === eventType);
			if (!mapping) {
				logger.debug('No usage mapping found for event type', { eventType });
				return;
			}

			const customerId = mapping.customerIdExtractor?.(eventData, clientId, ownerId);
			if (!customerId) {
				logger.debug('No customer ID extracted for usage tracking', { 
					eventType, 
					clientId, 
					ownerId 
				});
				return;
			}

			const value = mapping.valueCalculator?.(eventData) || 1;

			await usageSyncEngine.queueUsageEvent({
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
			});

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
		if (!this.isEnabled || events.length === 0) {
			return;
		}

		const trackingPromises = events.map(({ eventType, eventData, clientId, ownerId }) =>
			this.trackEventUsage(eventType, eventData, clientId, ownerId)
		);

		try {
			await Promise.allSettled(trackingPromises);
		} catch (error) {
			logger.error('Error in batch usage tracking', { error, batchSize: events.length });
		}
	}

	async trackCustomUsage(
		customerId: string,
		featureId?: string,
		eventName?: string,
		value = 1,
		metadata?: Record<string, any>
	): Promise<void> {
		if (!this.isEnabled) {
			return;
		}

		try {
			await usageSyncEngine.queueUsageEvent({
				customer_id: customerId,
				feature_id: featureId,
				event_name: eventName,
				value,
				timestamp: Date.now(),
				metadata: {
					...metadata,
					source: 'custom',
				},
			});

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
			});
		}
	}

	enable(): void {
		this.isEnabled = true;
		logger.info('Usage tracker enabled');
	}

	disable(): void {
		this.isEnabled = false;
		logger.info('Usage tracker disabled');
	}

	isTrackingEnabled(): boolean {
		return this.isEnabled;
	}
}

// Export a default instance
export const usageTracker = new UsageTracker(
	process.env.USAGE_TRACKING_ENABLED !== 'false' // Enabled by default, can be disabled via env
);