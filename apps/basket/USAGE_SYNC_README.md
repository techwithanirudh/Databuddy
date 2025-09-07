# Usage Tracking Sync Engine

This document describes the usage tracking sync engine that batches analytics events from the basket service to Autumn for billing and usage limit management.

## Overview

The usage sync engine provides:
- **Event Collection**: Automatically tracks usage events from analytics data
- **Redis Caching**: Buffers events in Redis for efficient batch processing
- **Autumn Integration**: Syncs events to Autumn's billing system using their SDK
- **Error Handling**: Includes retry logic and failed event management
- **Monitoring**: Provides status endpoints for observability

## Architecture

```
Analytics Events → Usage Tracker → Redis Queue → Sync Engine → Autumn API
```

### Components

1. **UsageTracker**: Collects and queues usage events from basket routes
2. **UsageSyncEngine**: Processes queued events in batches and syncs to Autumn
3. **Redis Layer**: Stores pending events, retry queue, and failed events
4. **Monitoring Routes**: Provides status and control endpoints

## Configuration

### Environment Variables

```bash
# Enable/disable usage sync engine (default: enabled)
USAGE_SYNC_ENABLED=true

# Enable/disable usage tracking (default: enabled)
USAGE_TRACKING_ENABLED=true
```

### Sync Engine Configuration

The sync engine can be configured when instantiated:

```typescript
const engine = new UsageSyncEngine({
  batchSize: 100,           // Number of events per batch (default: 100)
  syncIntervalMs: 30000,    // Sync interval in ms (default: 30 seconds)
  maxRetries: 3,            // Max retry attempts (default: 3)
  retryDelayMs: 1000,       // Base retry delay in ms (default: 1 second)
  redisKeyPrefix: 'usage:sync', // Redis key prefix (default: 'usage:sync')
});
```

## Event Mappings

The system automatically maps analytics events to usage events:

| Analytics Event | Autumn Feature/Event | Value | Customer ID Source |
|----------------|---------------------|-------|-------------------|
| `track` | `events` feature | 1 per event | `ownerId` or `clientId` |
| `error` | `events` feature | 1 per event | `ownerId` or `clientId` |
| `web_vitals` | `events` feature | 1 per event | `ownerId` or `clientId` |
| `custom` | `custom_events` event | 1 per event | `ownerId` or `clientId` |
| `outgoing_link` | `link_clicks` event | 1 per event | `ownerId` or `clientId` |

## API Endpoints

### Status and Control

- `GET /usage-sync/status` - Get sync engine status and statistics
- `POST /usage-sync/start` - Start the sync engine
- `POST /usage-sync/stop` - Stop the sync engine
- `POST /usage-sync/process-now` - Trigger immediate batch processing

### Failed Event Management

- `POST /usage-sync/clear-failed` - Clear all failed events
- `POST /usage-sync/reprocess-failed` - Requeue failed events for retry

### Tracker Control

- `POST /usage-sync/tracker/enable` - Enable usage tracking
- `POST /usage-sync/tracker/disable` - Disable usage tracking

### Custom Usage Tracking

- `POST /usage-sync/track-custom` - Track custom usage events

```json
{
  "customer_id": "user-123",
  "feature_id": "ai-messages",
  "value": 1,
  "metadata": {
    "source": "api",
    "additional_data": "..."
  }
}
```

## Redis Data Structure

The sync engine uses the following Redis keys:

- `usage:sync:pending` - List of pending events to process
- `usage:sync:failed` - List of permanently failed events
- `usage:sync:retry` - List of events queued for retry
- `usage:sync:last_sync` - Timestamp of last successful sync
- `usage:sync:stats` - Engine statistics and metrics

## Monitoring

### Status Response

```json
{
  "status": "success",
  "data": {
    "sync_engine": {
      "created_at": 1690000000000,
      "total_events": 1500,
      "successful_syncs": 1480,
      "failed_syncs": 20,
      "last_batch_time": 250,
      "last_batch_size": 50,
      "pending_events": 10,
      "failed_events": 2,
      "retry_queue_size": 3,
      "last_sync_time": 1690000300000,
      "is_running": true,
      "config": {
        "batchSize": 100,
        "syncIntervalMs": 30000,
        "maxRetries": 3,
        "retryDelayMs": 1000,
        "redisKeyPrefix": "usage:sync"
      }
    },
    "tracker_enabled": true,
    "timestamp": 1690000400000
  }
}
```

## Error Handling

### Retry Logic

1. **Exponential Backoff**: Retry delays increase exponentially (1s, 2s, 4s, etc.)
2. **Max Retries**: Events are retried up to `maxRetries` times
3. **Failed Events**: Permanently failed events are stored for manual review
4. **Automatic Retry**: Failed events are retried on the next batch cycle

### Event Flow

```
Event → Queue → Batch → Autumn API
                ↓ (on failure)
             Retry Queue → Batch → Autumn API
                ↓ (max retries exceeded)
             Failed Events Storage
```

## Integration Examples

### Direct Usage Tracking

```typescript
import { usageTracker } from './lib/usage-tracker';

// Track a custom usage event
await usageTracker.trackCustomUsage(
  'customer-123',
  'api-calls',
  undefined,
  1,
  { endpoint: '/api/data', method: 'GET' }
);
```

### Batch Usage Tracking

```typescript
const events = [
  { eventType: 'track', eventData: {...}, clientId: 'client1', ownerId: 'owner1' },
  { eventType: 'custom', eventData: {...}, clientId: 'client2', ownerId: 'owner2' },
];

await usageTracker.trackBatchUsage(events);
```

## Performance Considerations

- **Async Processing**: Usage tracking is non-blocking and won't impact API response times
- **Batch Processing**: Events are processed in batches for efficiency
- **Redis Buffering**: Events are buffered in Redis to handle traffic spikes
- **Error Isolation**: Failed events don't block successful events

## Deployment

The sync engine automatically starts when the basket service starts if `USAGE_SYNC_ENABLED` is not set to `false`.

### Health Checks

Monitor the engine using:
- `GET /usage-sync/status` endpoint
- Application logs for sync engine activities
- Redis monitoring for queue sizes

### Scaling Considerations

- **Single Instance**: The sync engine should run on a single instance to avoid duplicate processing
- **Redis Scaling**: Redis should be properly sized for the event volume
- **Autumn Rate Limits**: Consider Autumn API rate limits when configuring batch sizes

## Troubleshooting

### Common Issues

1. **Events Not Syncing**: Check if sync engine is running via status endpoint
2. **High Failed Event Count**: Check Autumn API connectivity and credentials
3. **Memory Issues**: Monitor Redis memory usage and consider key expiration
4. **Performance**: Adjust batch size and sync interval based on event volume

### Logging

The sync engine logs at various levels:
- `INFO`: Startup, shutdown, batch processing summary
- `DEBUG`: Individual event processing details
- `ERROR`: Failures, retry attempts, critical issues

### Manual Recovery

If events get stuck:
1. Check failed events: `GET /usage-sync/status`
2. Reprocess failed events: `POST /usage-sync/reprocess-failed`
3. Clear failed events if needed: `POST /usage-sync/clear-failed`