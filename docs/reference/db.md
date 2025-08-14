## @databuddy/db

### Overview
- Exposes Drizzle ORM (`export * from 'drizzle-orm'`), a configured Postgres client `db`, and ClickHouse client/schema exports.
- Also exports all Drizzle `schema` and `relations` so you can write typed queries.

### Usage
```ts
import { db, eq, websites } from '@databuddy/db';

const list = await db.query.websites.findMany({
  where: eq(websites.userId, userId),
  limit: 20,
});
```

### Environment
- Requires `DATABASE_URL` to be set.