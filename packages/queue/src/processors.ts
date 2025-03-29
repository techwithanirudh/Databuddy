/**
 * Queue Job Processors
 * 
 * This file contains the processors for different queue jobs.
 */

import { Job } from 'bullmq';
import { createLogger } from '@databuddy/logger';
import { EventJobData, JobResult, QueueName, TrackingEvent } from './types';
import { createWorker } from './utils';

// Initialize logger
const logger = createLogger('queue:processors');

// Store process handler function type
export type EventProcessHandler = (
  event: TrackingEvent, 
  clientId: string, 
  headers: Record<string, string>, 
  ip: string
) => Promise<{ status: string; reason?: string }>;

// Store the process handler
let eventProcessHandler: EventProcessHandler | null = null;

/**
 * Set the event process handler function
 * This should be called by the API to register the handler
 */
export function setEventProcessHandler(handler: EventProcessHandler) {
  eventProcessHandler = handler;
  logger.info('Event process handler registered');
}

/**
 * Process an event job
 * This function will be called by the worker to process queued events
 */
export async function processEventJob(job: Job<EventJobData>): Promise<JobResult> {
  try {
    const { event, clientId, headers, ip, timestamp } = job.data;
    
    logger.debug('Processing event job', { 
      jobId: job.id, 
      clientId,
      anonymousId: event.payload.anonymousId?.substring(0, 8) || 'none',
      eventType: event.type
    });
    
    // Check if handler is registered
    if (!eventProcessHandler) {
      logger.warn('No event process handler registered, job will be retried later', { jobId: job.id });
      throw new Error('Event process handler not registered');
    }
    
    // Call the handler provided by the API
    const result = await eventProcessHandler(event, clientId, headers, ip);
    
    logger.debug('Event job processed successfully', { 
      jobId: job.id, 
      status: result.status 
    });
    
    return {
      success: true,
      data: {
        id: job.id,
        clientId,
        event: event.type,
        status: result.status,
        reason: result.reason,
        processedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('Error processing event job', { 
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // For specific errors, we might want to not retry
    const errorMessage = error instanceof Error ? error.message : String(error);
    const shouldRetry = !errorMessage.includes('Invalid event data');
    
    if (!shouldRetry) {
      logger.warn('Marking job as non-retryable', { jobId: job.id });
      await job.discard();
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Initialize event queue worker
 * This sets up the worker that processes events from the queue
 */
export async function initEventQueueWorker(concurrency = 5) {
  logger.info(`Initializing event queue worker with concurrency ${concurrency}`);
  const worker = await createWorker(QueueName.EVENTS, processEventJob, concurrency);
  
  // Log worker events
  worker.on('active', ({ id }) => {
    logger.debug(`Job ${id} has started processing`);
  });
  
  worker.on('completed', ({ id }) => {
    logger.debug(`Job ${id} has completed processing`);
  });
  
  worker.on('failed', ({ id }, error) => {
    logger.error(`Job ${id} has failed`, { error: error.message });
  });
  
  logger.info('Event queue worker initialized');
  return worker;
} 