import { cleanupOldBookings } from './bookings';
import { getDb } from './db';

const DAILY_MS = 24 * 60 * 60 * 1000;

/**
 * Löscht abgelaufene Einträge (Ende > 30 Tage her) beim Serverstart und
 * danach einmal täglich. Kein externer Cron nötig.
 */
export function startCleanupJob(): void {
	runCleanup();
	const interval = setInterval(runCleanup, DAILY_MS);
	interval.unref();
}

function runCleanup(): void {
	try {
		const deleted = cleanupOldBookings(getDb());
		if (deleted > 0) {
			console.info(`[cleanup] ${deleted} alte Einträge gelöscht`);
		}
	} catch (err) {
		console.error('[cleanup] Fehler beim Aufräumen:', err);
	}
}
