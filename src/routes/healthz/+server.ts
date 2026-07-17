import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

/** Healthcheck für Reverse Proxy / Container (ohne Passwort erreichbar). */
export const GET: RequestHandler = () => {
	try {
		getDb().run(sql`SELECT 1`);
		return json({ status: 'ok' });
	} catch {
		return json({ status: 'error' }, { status: 503 });
	}
};
