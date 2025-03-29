import { getRedisQueue } from '@databuddy/redis';
import { Queue, Worker, QueueEvents, ConnectionOptions } from 'bullmq';
import { createLogger } from '@databuddy/logger';
import { Redis } from '@databuddy/redis';
import { QueueEventsRegistry, QueueJobMap, QueueName, QueueRegistry, WorkerRegistry } from './types';

// Initialize logger
const logger = createLogger('queue');

// Global registries to track queue and worker instances
const queues: QueueRegistry = {};
const workers: WorkerRegistry = {};
const queueEvents: QueueEventsRegistry = {};

/**
 * Get connection options for BullMQ
 */
export async function getConnectionOptions(): Promise<ConnectionOptions> {
  return { client: Redis } as ConnectionOptions;
}

/**
 * Get a queue instance, creating it if it doesn't exist
 */
export async function getQueue<T extends QueueName>(
  name: T
): Promise<Queue<QueueJobMap[T], any, T>> {
  if (!queues[name]) {
    logger.debug(`Creating queue: ${name}`);
    queues[name] = new Queue(name, {
      connection: await getConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep successful jobs for 24 hours
          count: 1000,    // Keep the last 1000 successful jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });
  }
  return queues[name] as Queue<QueueJobMap[T], any, T>;
}

/**
 * Create a worker for a queue
 */
export async function createWorker<T extends QueueName>(
  name: T,
  processor: (job: any) => Promise<any>,
  concurrency = 5
): Promise<Worker<QueueJobMap[T], any, T>> {
  if (workers[name]) {
    return workers[name] as Worker<QueueJobMap[T], any, T>;
  }

  logger.debug(`Creating worker for queue: ${name}`);
  const worker = new Worker<QueueJobMap[T], any, T>(
    name,
    processor,
    {
      connection: await getConnectionOptions(),
      concurrency,
      autorun: true,
    }
  );

  // Set up event handlers
  worker.on('completed', (job) => {
    logger.debug(`Job ${job.id} completed in queue ${name}`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Job ${job?.id} failed in queue ${name}`, { error: error.message, stack: error.stack });
  });

  worker.on('error', (error) => {
    logger.error(`Worker error in queue ${name}`, { error: error.message });
  });

  workers[name] = worker;
  return worker;
}

/**
 * Get a queue events instance for monitoring
 */
export async function getQueueEvents(name: QueueName): Promise<QueueEvents> {
  if (!queueEvents[name]) {
    queueEvents[name] = new QueueEvents(name, {
      connection: await getConnectionOptions(),
    });
  }
  return queueEvents[name];
}

/**
 * Clean up all queues and workers - useful during shutdown
 */
export async function closeAll(): Promise<void> {
  logger.info('Closing all queues and workers');
  
  // Close all workers
  for (const name in workers) {
    if (workers[name]) {
      logger.debug(`Closing worker for queue: ${name}`);
      await workers[name].close();
    }
  }
  
  // Close all queue event listeners
  for (const name in queueEvents) {
    if (queueEvents[name]) {
      logger.debug(`Closing queue events for queue: ${name}`);
      await queueEvents[name].close();
    }
  }
  
  // Close all queues
  for (const name in queues) {
    if (queues[name]) {
      logger.debug(`Closing queue: ${name}`);
      await queues[name].close();
    }
  }
  
  logger.info('All queues and workers closed');
} 