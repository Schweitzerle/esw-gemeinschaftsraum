import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { getConfig } from '../env';
import { createDb, type AppDb } from './create-db';

let instance: AppDb | undefined;

/** App-weite Datenbank-Instanz (lazy, damit `vite build` keine DB anlegt). */
export function getDb(): AppDb {
	if (!instance) {
		const { databasePath } = getConfig();
		if (databasePath !== ':memory:') {
			mkdirSync(dirname(databasePath), { recursive: true });
		}
		instance = createDb(databasePath);
	}
	return instance;
}
