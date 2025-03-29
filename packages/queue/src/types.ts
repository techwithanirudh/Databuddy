import { Queue, Worker, QueueEvents } from 'bullmq';

/**
 * Queue names used throughout the application
 */
export enum QueueName {
  EVENTS = 'events',
}

/**
 * Generic tracking event interface
 * This matches the structure used in the API but is defined here to avoid circular dependencies
 */
export interface TrackingEventPayload {
  name?: string;
  anonymousId?: string;
  profileId?: string;
  properties?: Record<string, any>;
  property?: string;
  value?: number;
}

export interface TrackingEvent {
  type: 'track' | 'alias' | 'increment' | 'decrement';
  payload: TrackingEventPayload;
}

/**
 * Mapping of queue names to their job data types
 */
export interface QueueJobMap {
  [QueueName.EVENTS]: EventJobData;
}

/**
 * Job data structure for the events queue
 */
export interface EventJobData {
  event: TrackingEvent;
  clientId: string;
  headers: Record<string, string>;
  ip: string;
  timestamp: string;
}

/**
 * Queue registry type that maps queue names to their queue instances
 */
export interface QueueRegistry {
  [key: string]: Queue<any, any, string>;
}

/**
 * Worker registry type that maps queue names to their worker instances
 */
export interface WorkerRegistry {
  [key: string]: Worker<any, any, string>;
}

/**
 * Queue events registry type that maps queue names to their event instances
 */
export interface QueueEventsRegistry {
  [key: string]: QueueEvents;
}

/**
 * Result of a queue job processing
 */
export interface JobResult {
  success: boolean;
  error?: string;
  data?: any;
} 