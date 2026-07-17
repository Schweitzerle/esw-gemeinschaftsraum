import type { Booking } from './db/schema';

export interface NowStatus {
	/** Läuft gerade eine Belegung? */
	current?: Booking;
	/** Nächste künftige Belegung (falls vorhanden) */
	next?: Booking;
}

/**
 * Ermittelt aus einer nach Start sortierten Liste, was gerade im Raum los ist
 * und was als Nächstes ansteht.
 */
export function getNowStatus(bookings: Booking[], nowMs: number = Date.now()): NowStatus {
	const current = bookings.find((b) => b.startsAt <= nowMs && nowMs < b.endsAt);
	const next = bookings.find((b) => b.startsAt > nowMs);
	return { current, next };
}
