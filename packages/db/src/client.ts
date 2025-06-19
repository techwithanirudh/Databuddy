import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from './drizzle/schema';
import * as relations from './drizzle/relations';

// Combine schema and relations
const fullSchema = { ...schema, ...relations };

const databaseUrl = process.env.DATABASE_URL as string;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
}

export const db = drizzle(databaseUrl, { schema: fullSchema });

const migrateDb = async () => {
    await migrate(db, { migrationsFolder: 'drizzle/migrations' });
}

migrateDb();