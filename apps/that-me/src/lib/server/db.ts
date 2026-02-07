import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema.js';

export type Database = DrizzleD1Database<typeof schema>;

export function getDb(platform: App.Platform): Database {
	return drizzle(platform.env.DB, { schema });
}
