## @databuddy/validation

### Constants
- `MAX_FUTURE_MS`, `MIN_TIMESTAMP`
- `VALIDATION_LIMITS`: field length and range limits used across validation.

### Regexes
- `RESOLUTION_REGEX`, `RESOLUTION_SIMPLE_REGEX`
- `LANGUAGE_REGEX`, `TIMEZONE_REGEX`, `SESSION_ID_REGEX`
- `LOCALHOST_URL_REGEX`, `DURATION_REGEX`
- `WEBSITE_NAME_REGEX`, `DOMAIN_REGEX`, `SUBDOMAIN_REGEX`

### Utilities

- `parseDurationToSeconds(duration: string): number`
```ts
parseDurationToSeconds('15s'); // 15
parseDurationToSeconds('2m');  // 120
parseDurationToSeconds('1h');  // 3600
parseDurationToSeconds('1d');  // 86400
```

- `sanitizeString(input: unknown, maxLength?: number): string`
  - Trims, removes control chars and HTML specials, collapses whitespace.

- `validateTimezone(value: unknown): string`
- `validateTimezoneOffset(value: unknown): number | null`
- `validateLanguage(value: unknown): string`
- `validateSessionId(value: unknown): string`
- `validateUtmParameter(value: unknown): string`
- `validateNumeric(value: unknown, min?: number, max?: number): number | null`
- `validateUrl(value: unknown): string`
- `filterSafeHeaders(headers: Record<string, string|string[]|undefined>): Record<string, string>`
- `validateProperties(properties: unknown): Record<string, unknown>`
- `validatePayloadSize(data: unknown, maxSizeBytes = 1_048_576): boolean`
- `validatePerformanceMetric(value: unknown): number | undefined`
- `validateScreenResolution(value: unknown): string`
- `validateViewportSize(value: unknown): string`
- `validateScrollDepth(value: unknown): number | null`
- `validatePageCount(value: unknown): number | null`
- `validateInteractionCount(value: unknown): number | null`
- `validateExitIntent(value: unknown): number`

Example:
```ts
import {
  validateUrl,
  validateLanguage,
  validateProperties,
  filterSafeHeaders,
} from '@databuddy/validation';

const url = validateUrl('https://example.com/path?x=1');
const lang = validateLanguage('en-US');
const props = validateProperties({ name: ' Alice  ', score: '42', active: true, unset: undefined });
// props -> { name: 'Alice', score: 42, active: true, unset: null }

const safe = filterSafeHeaders({ 'User-Agent': 'X', 'X-Secret': 'hidden' });
// safe -> { 'user-agent': 'X' }
```

### Schemas (zod)
- `analyticsEventSchema`
- `batchAnalyticsEventSchema`, `batchAnalyticsEventsSchema`
- `emailEventSchema`, `batchEmailEventSchema`
- `errorEventSchema`
- `webVitalsEventSchema`
- `websiteNameSchema`, `domainSchema`, `subdomainSchema`, `createWebsiteSchema`, `updateWebsiteSchema`, `transferWebsiteSchema`

Usage:
```ts
import { analyticsEventSchema } from '@databuddy/validation';

const parsed = analyticsEventSchema.parse(input);
```