/**
 * Queue Definitions
 * 
 * This file defines and exports the queues used throughout the application.
 */

import { Job } from 'bullmq';
import { createLogger } from '@databuddy/logger';
import { EventJobData, JobResult, QueueName } from './types';
import { getQueue } from './utils';

// Initialize logger
const logger = createLogger('queue:events');

/**
 * Add an analytics event to the queue
 */
export async function queueEvent(data: EventJobData): Promise<string> {
  try {
    const queue = await getQueue(QueueName.EVENTS);
    const job = await queue.add(QueueName.EVENTS, data, {
      // We want to ensure events are processed in order for the same anonymousId
      jobId: `${data.clientId}:${data.event.payload.anonymousId || 'anonymous'}:${Date.now()}`,
    });
    
    logger.debug('Event queued', { 
      jobId: job.id, 
      clientId: data.clientId,
      anonymousId: data.event.payload.anonymousId?.substring(0, 8) || 'none',
      eventType: data.event.type,
    });
    
    return job.id;
  } catch (error) {
    logger.error('Failed to queue event', { 
      error: error instanceof Error ? error.message : String(error),
      clientId: data.clientId,
      eventType: data.event.type,
    });
    
    // Rethrow the error to be handled by the caller
    throw error;
  }
}

/**
 * Get a job from the events queue
 */
export async function getEventJob(jobId: string): Promise<Job<EventJobData> | undefined> {
  const queue = await getQueue(QueueName.EVENTS);
  return queue.getJob(jobId);
}

/**
 * Get job counts from the events queue
 */
export async function getEventQueueCounts() {
  const queue = await getQueue(QueueName.EVENTS);
  return queue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting');
}

/**
 * Clean completed and failed jobs
 */
export async function cleanEventQueue() {
  const queue = await getQueue(QueueName.EVENTS);
  
  // Clean old jobs - keep last 1000 completed/failed jobs
  await queue.clean(24 * 60 * 60 * 1000, 1000, 'completed');
  await queue.clean(7 * 24 * 60 * 60 * 1000, 1000, 'failed');
  
  logger.info('Event queue cleaned');
} 