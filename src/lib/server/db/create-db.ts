import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

export type AppDb = BetterSQLite3Database<typeof schema>;

/**
 * Öffnet die SQLite-Datenbank und führt ausstehende Migrationen aus.
 * `:memory:` wird in Tests verwendet.
 */
export function createDb(path: string): AppDb {
	const client = new Database(path);
	client.pragma('journal_mode = WAL');
	client.pragma('busy_timeout = 5000');
	const db = drizzle(client, { schema });
	migrate(db, { migrationsFolder: 'drizzle' });
	return db;
}
