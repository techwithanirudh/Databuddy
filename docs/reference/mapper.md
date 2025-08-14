## @databuddy/mapper

### Overview
- Normalizes third-party analytics export rows into Databuddy `AnalyticsEvent` objects.
- Exports:
  - `mapEvents(adapter, rows)`
  - `adapters.umami(clientId)` and `AnalyticsEventAdapter` type

### Umami Adapter
```ts
import { adapters, mapEvents } from '@databuddy/mapper';

const adapter = adapters.umami('YOUR_CLIENT_ID');
const events = mapEvents(adapter, umamiCsvRows);
// events: AnalyticsEvent[] ready for ingestion
```

The adapter maps fields like `session_id`, `distinct_id`, geo, screen, UTM fields, page title, and timestamps to Databuddy event structure.