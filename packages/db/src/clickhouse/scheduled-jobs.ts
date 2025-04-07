/**
 * ClickHouse Scheduled Jobs
 * 
 * Provides functions for running aggregation and maintenance tasks
 * on a scheduled basis to keep the analytics data up-to-date.
 */

import { createLogger } from '@databuddy/logger';
import { format, subDays } from 'date-fns';
import { clickHouse } from './client';
import { aggregateAllStats, aggregateMissingDates } from './aggregation';

const logger = createLogger('clickhouse:scheduled-jobs');

/**
 * Get all active client IDs (websites) from events table
 * 
 * @param daysLookback Number of days to look back for active clients
 */
async function getActiveClientIds(daysLookback: number = 30): Promise<string[]> {
  try {
    const startDate = format(subDays(new Date(), daysLookback), 'yyyy-MM-dd');
    
    const query = `
      SELECT DISTINCT client_id
      FROM analytics.events
      WHERE toDate(time) >= parseDateTimeBestEffort('${startDate}')
    `;
    
    const result = await clickHouse.query({ query });
    const data = await result.json();
    
    return data.data.map((row: { client_id: string }) => row.client_id);
  } catch (error) {
    logger.error('Error fetching active client IDs:', error);
    return [];
  }
}

/**
 * Run daily aggregation for all active clients
 * 
 * @param daysLookback Number of days to look back for aggregation
 */
export async function runDailyAggregation(daysLookback: number = 7) {
  try {
    logger.info('Starting daily aggregation job');
    const startTime = Date.now();
    
    // Get all active clients
    const clientIds = await getActiveClientIds();
    logger.info(`Found ${clientIds.length} active clients`);
    
    if (clientIds.length === 0) {
      logger.info('No active clients found, skipping aggregation');
      return {
        success: true,
        message: 'No active clients found to aggregate',
        duration: Date.now() - startTime
      };
    }
    
    // Set date range
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), daysLookback), 'yyyy-MM-dd');
    
    // Run aggregation for each client
    const results = [];
    
    for (const clientId of clientIds) {
      logger.info(`Running daily aggregation for client ${clientId}`);
      
      try {
        const result = await aggregateAllStats(clientId, startDate, endDate);
        results.push({
          client_id: clientId,
          success: result.success,
          message: result.message
        });
        
        if (result.success) {
          logger.info(`Successfully aggregated data for client ${clientId}`);
        } else {
          logger.error(`Failed to aggregate data for client ${clientId}: ${result.message}`);
        }
      } catch (error) {
        logger.error(`Error during aggregation for client ${clientId}:`, error);
        results.push({
          client_id: clientId,
          success: false,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info(`Completed daily aggregation job in ${duration}ms`);
    
    return {
      success: true,
      message: `Completed daily aggregation for ${clientIds.length} clients`,
      duration,
      results
    };
  } catch (error) {
    logger.error('Error in daily aggregation job:', error);
    return {
      success: false,
      message: 'Failed to run daily aggregation job',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check for missing aggregation data and fill gaps
 * 
 * @param daysLookback Number of days to look back for missing data
 */
export async function runMissingDataCheck(daysLookback: number = 30) {
  try {
    logger.info('Starting missing data check job');
    const startTime = Date.now();
    
    // Get all active clients
    const clientIds = await getActiveClientIds(daysLookback);
    logger.info(`Found ${clientIds.length} active clients`);
    
    if (clientIds.length === 0) {
      logger.info('No active clients found, skipping missing data check');
      return {
        success: true,
        message: 'No active clients found for missing data check',
        duration: Date.now() - startTime
      };
    }
    
    // Check and aggregate missing data for each client
    const results = [];
    
    for (const clientId of clientIds) {
      logger.info(`Checking for missing data for client ${clientId}`);
      
      try {
        const result = await aggregateMissingDates(clientId, daysLookback);
        results.push({
          client_id: clientId,
          success: result.success,
          message: result.message,
          missing_count: result.details?.missing_dates?.length || 0
        });
        
        if (result.success) {
          logger.info(`Completed missing data check for client ${clientId}: ${result.message}`);
        } else {
          logger.error(`Failed missing data check for client ${clientId}: ${result.message}`);
        }
      } catch (error) {
        logger.error(`Error during missing data check for client ${clientId}:`, error);
        results.push({
          client_id: clientId,
          success: false,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info(`Completed missing data check job in ${duration}ms`);
    
    return {
      success: true,
      message: `Completed missing data check for ${clientIds.length} clients`,
      duration,
      results
    };
  } catch (error) {
    logger.error('Error in missing data check job:', error);
    return {
      success: false,
      message: 'Failed to run missing data check job',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Optimize ClickHouse tables for better performance
 */
export async function runDatabaseOptimization() {
  try {
    logger.info('Starting database optimization job');
    const startTime = Date.now();
    
    const tables = [
      'events',
      'sessions',
      'daily_stats',
      'page_stats',
      'referrer_stats',
      'location_stats',
      'device_stats',
      'performance_stats'
    ];
    
    for (const table of tables) {
      logger.info(`Optimizing table: analytics.${table}`);
      
      try {
        await clickHouse.command({
          query: `OPTIMIZE TABLE analytics.${table} FINAL`
        });
        logger.info(`Successfully optimized table: analytics.${table}`);
      } catch (error) {
        logger.error(`Error optimizing table analytics.${table}:`, error);
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info(`Completed database optimization job in ${duration}ms`);
    
    return {
      success: true,
      message: 'Database optimization completed',
      duration,
      tables
    };
  } catch (error) {
    logger.error('Error in database optimization job:', error);
    return {
      success: false,
      message: 'Failed to run database optimization job',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Run cleanup job to remove outdated temporary or excessive data
 */
export async function runDatabaseCleanup() {
  try {
    logger.info('Starting database cleanup job');
    const startTime = Date.now();
    
    // Add any cleanup tasks here
    // For example, purging temporary tables or removing expired data
    
    const duration = Date.now() - startTime;
    logger.info(`Completed database cleanup job in ${duration}ms`);
    
    return {
      success: true,
      message: 'Database cleanup completed',
      duration
    };
  } catch (error) {
    logger.error('Error in database cleanup job:', error);
    return {
      success: false,
      message: 'Failed to run database cleanup job',
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 