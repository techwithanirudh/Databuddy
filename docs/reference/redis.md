## @databuddy/redis

### Redis Client
- `redis`: a singleton ioredis client (JSON helpers included)
- `getRedisCache()`: returns the singleton client (throws if `REDIS_URL` missing)
- `getRawRedis()`: returns a non-extended raw client
- `getJson<T>(key): Promise<T|null>` and `setJson<T>(key, value, expireInSec)` on the extended client
- Lock helpers: `getLock(key, value, timeoutMs)`, `releaseLock(key, value)`, `isRedisConnected()`, `disconnectRedis()`

```ts
import { redis, getLock, releaseLock } from '@databuddy/redis';

await redis.set('hello', 'world');
const got = await redis.get('hello');

const ok = await getLock('my-lock', 'job-123', 10_000);
if (ok) {
  try {
    // do work
  } finally {
    await releaseLock('my-lock', 'job-123');
  }
}
```

### cacheable(fn, options)
- Memoizes async functions in Redis with SWR support.
- Options: `expireInSec`, `prefix?`, `serialize?`, `deserialize?`, `staleWhileRevalidate?`, `staleTime?`, `maxRetries?`.
- Returns a wrapped function with helpers: `.getKey(...)`, `.clear(...)`, `.clearAll()`, `.invalidate(...)`.

```ts
import { cacheable } from '@databuddy/redis';

const getUser = cacheable(async (id: string) => {
  // fetch from DB
  return { id, name: 'Ada' };
}, { expireInSec: 300, prefix: 'user', staleWhileRevalidate: true, staleTime: 30 });

const u = await getUser('123');
await getUser.clear('123');
```

### getCache(key, options, fn)
- Low-level helper to read-through cache a promise with SWR.

```ts
import { getCache } from '@databuddy/redis';

const data = await getCache('stats:today', { expireInSec: 60 }, async () => {
  // compute expensive stats
  return { sessions: 42 };
});
```

### Drizzle Cache
- `createDrizzleCache({ redis, namespace? })` provides:
  - `withCache({ key, ttl?, tables?, tag?, autoInvalidate?, queryFn })`
  - `invalidateByTables(tables: string[])`, `invalidateByTags(tags: string[])`, `invalidateByKey(key: string)`
  - `cleanupDeps()`

Example:
```ts
import { createDrizzleCache, redis } from '@databuddy/redis';

const websiteCache = createDrizzleCache({ redis, namespace: 'websites' });
const site = await websiteCache.withCache({
  key: 'getById:abc',
  ttl: 600,
  tables: ['websites'],
  queryFn: () => db.query.websites.findFirst({ where: eq(websites.id, 'abc') })
});
```