## @databuddy/sdk

### Installation

```bash
bun add @databuddy/sdk
# or
npm install @databuddy/sdk
```

### React Component: Databuddy

- **Import**:
```tsx
import { Databuddy } from '@databuddy/sdk';
```
- **Usage (Next.js root layout)**:
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <Databuddy
        clientId={process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID!}
        trackScreenViews
        trackPerformance
        trackErrors
        enableBatching
        batchSize={20}
      />
      <body>{children}</body>
    </html>
  );
}
```

- **Props**: See `DatabuddyConfig` below. The component injects the `databuddy.js` script and converts all props to `data-*` attributes. `sdkVersion` defaults to the package version.

### Types

- `DatabuddyConfig`: Full configuration for the component and SDK script (apiUrl, scriptUrl, feature flags like trackPerformance, batching options, etc.). See `packages/sdk/src/types.ts` for all fields and defaults.
- `EventName`, `EventTypeMap`, `PropertiesForEvent<T>`: Type-safe event names and property shapes used by the tracker.

### Tracker APIs

- `isTrackerAvailable(): boolean`
  - Returns true if `window.databuddy` or `window.db` exists in the browser.
  - Example:
```ts
import { isTrackerAvailable } from '@databuddy/sdk';

if (isTrackerAvailable()) {
  console.log('Databuddy tracker ready');
}
```

- `getTracker(): DatabuddyTracker | null`
  - Returns the global tracker instance if available.
  - Example:
```ts
import { getTracker } from '@databuddy/sdk';

const tracker = getTracker();
tracker?.screenView('/pricing');
```

- `track<T extends EventName>(eventName: T, properties?: PropertiesForEvent<T>): Promise<void>`
  - Type-safe event tracking helper that proxies to `window.db.track` or `window.databuddy.track`.
  - Example:
```ts
import { track } from '@databuddy/sdk';

await track('screen_view', { scroll_depth: 80, is_bounce: 0 });
await track('error', { message: 'Oops', error_type: 'NetworkError' });
```

- `trackError(message: string, properties?: { filename?; lineno?; colno?; stack?; error_type?; [k: string]: any }): Promise<void>`
  - Convenience wrapper around `track('error', ...)`.

- `clear(): void`
  - Clears the current session via `window.db.clear()` or `window.databuddy.clear()`.

- `flush(): void`
  - Flushes any queued events.

### Global Window Shorthands

- `window.db.track(...)`, `window.db.screenView(...)`, `window.db.clear()`, `window.db.flush()` are supported by the browser script. The SDK helpers above proxy to these when available.

### Example: Custom Interaction Tracking
```ts
import { track } from '@databuddy/sdk';

function SignupButton() {
  return (
    <button
      onClick={() => track('button_click', { button_text: 'Sign up', button_id: 'signup-cta' })}
    >
      Sign up
    </button>
  );
}
```