## @databuddy/shared

### Utilities

#### Date Utilities
- `formatDate(date, options?): string`
  - Options: `timezone`, `dateFormat`, `timeFormat`, `showTime`, `customFormat`.
```ts
import { formatDate, convertToTimezone, formatRelativeTime } from '@databuddy/shared';

formatDate('2025-01-01', { timezone: 'UTC' });
formatDate(Date.now(), { showTime: true });
convertToTimezone('2025-01-01T00:00:00Z', 'America/New_York');
formatRelativeTime(Date.now() - 3600_000); // "an hour ago"
```

- `getBrowserTimezone(): string`
- `findTimezoneByRegion(region: string)`

#### ID Utility
- `createId(type?: 'UUID' | 'NANOID'): string`
```ts
import { createId } from '@databuddy/shared';

createId();        // UUID v4
createId('NANOID'); // 10-char nanoid
```

#### Discord Webhook Utilities
- `initializeDiscordWebhook(url, options?) => DiscordWebhook`
- `initializeErrorWebhook(url) => DiscordWebhook`
- `initializeActivityWebhook(url) => DiscordWebhook`
- `getDefaultWebhook() | getErrorWebhook() | getActivityWebhook()`
- `discord` convenience object
- `logger` pre-configured instance

Example:
```ts
import { initializeDiscordWebhook, discord, logger } from '@databuddy/shared';

initializeDiscordWebhook(process.env.DISCORD_WEBHOOK_URL!);
await discord.log.success('Deployment', 'New version deployed', { version: '1.2.3' });

try {
  throw new Error('Boom');
} catch (e) {
  logger.exception(e as Error, { service: 'api' });
}
```

### Lists
- `filterOptions`: array of allowed filter fields for query UI and API.
- `TIMEZONES`, `bots`, `referrers`: curated datasets for enrichment.

### Types
- Various types for metrics, pages, journeys, errors, website models, realtime payloads, etc. Import from `@databuddy/shared` as needed to type responses and UI models.