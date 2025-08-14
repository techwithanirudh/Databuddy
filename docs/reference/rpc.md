## @databuddy/rpc

### Overview
- Uses tRPC for type-safe server procedures.
- Exports:
  - `appRouter`, `type AppRouter`
  - `createTRPCContext`, `createTRPCRouter`, `publicProcedure`, `protectedProcedure`, `rateLimitedProtectedProcedure`, `rateLimitedAdminProcedure`
  - `getRateLimitIdentifier`, `rateLimiters`

### Context
```ts
import { createTRPCContext } from '@databuddy/rpc';

// Called per request (headers required)
const ctx = await createTRPCContext({ headers: request.headers });
// ctx = { db, auth, session, user, headers }
```

### Routers
```ts
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@databuddy/rpc';

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure.query(() => 'world'),
  me: protectedProcedure.query(({ ctx }) => ctx.user),
});
```

The `appRouter` mounts feature routers like `websites`, `funnels`, `preferences`, `goals`, `autocomplete`, `apikeys`, `experiments`.

### Rate Limiting Utilities
- `getRateLimitIdentifier(userId?: string, headers?: Headers): string`
- `RateLimiter` class with methods:
  - `checkLimit(identifier: string): Promise<{ success; limit; remaining; reset; }>`
  - `getStatus(identifier: string)`
  - `reset(identifier: string)`
- Built-in `rateLimiters`: `api`, `auth`, `expensive`, `admin`, `public`.

Use within procedures via `rateLimitedProtectedProcedure` or in HTTP middleware (see `apps/api`).

### Referrer Utilities
- `parseReferrer(referrerUrl: string | null | undefined, currentDomain?: string): { type; name; url; domain }`
- `categorizeReferrer(info): string`
- `isInternalReferrer(referrerUrl: string, websiteHostname?: string): boolean`

Example:
```ts
import { parseReferrer, categorizeReferrer } from '@databuddy/rpc/utils/referrer';

const info = parseReferrer('https://www.google.com/search?q=databuddy', 'example.com');
// { type: 'search', name: 'www.google.com', ... }
const category = categorizeReferrer(info); // 'Search Engine'
```

### Auth Utilities
- `authorizeWebsiteAccess(ctx, websiteId, permission: 'read'|'update'|'delete'|'transfer')`
  - Ensures the current user (from tRPC context) has access to the given website, considering public sites, owner, admin, or org permissions; throws `TRPCError` otherwise.
```ts
import { authorizeWebsiteAccess } from '@databuddy/rpc/utils/auth';

export const websitesRouter = createTRPCRouter({
  get: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const site = await authorizeWebsiteAccess(ctx, input, 'read');
    return site;
  })
});
```

### Billing Utilities
- `checkAndTrackWebsiteCreation(customerId: string)` → `{ allowed: boolean, error?: string }`
- `trackWebsiteUsage(customerId: string, value: number)` → `{ success: boolean }`
- `getBillingCustomerId(userId: string, organizationId?: string|null): Promise<string>`

```ts
import { getBillingCustomerId, checkAndTrackWebsiteCreation } from '@databuddy/rpc/utils/billing';

const customerId = await getBillingCustomerId(ctx.user.id, ctx.user.organizationId);
const { allowed } = await checkAndTrackWebsiteCreation(customerId);
if (!allowed) throw new TRPCError({ code: 'FORBIDDEN' });
```

### Cache Invalidation Helpers
- `invalidateBasicWebsiteCaches(websiteId, websiteCache)`
- `invalidateWebsiteCaches(websiteId, userId, reason?)`

```ts
import { createDrizzleCache, redis } from '@databuddy/redis';
import { invalidateBasicWebsiteCaches, invalidateWebsiteCaches } from '@databuddy/rpc/utils/cache-invalidation';

const websiteCache = createDrizzleCache({ redis, namespace: 'websites' });
await invalidateBasicWebsiteCaches(websiteId, websiteCache);
await invalidateWebsiteCaches(websiteId, ctx.user.id, 'website updated');
```