import { and, asc, eq, gt, lt, ne, type SQL } from 'drizzle-orm';
import type { AppDb } from './db/create-db';
import { bookings, type Booking } from './db/schema';
import { generateEditToken, verifyToken } from './tokens';

/** Vergangene Einträge werden 30 Tage nach ihrem Ende gelöscht. */
export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export interface BookingInput {
	title: string;
	description: string | null;
	name: string;
	contact: string;
	isPublic: boolean;
	openEnd: boolean;
	startsAt: number;
	endsAt: number;
}

export type CreateBookingResult =
	{ ok: true; booking: Booking; editToken: string } | { ok: false; conflict: Booking };

export type UpdateBookingResult =
	| { ok: true; booking: Booking }
	| { ok: false; reason: 'invalid-token' }
	| { ok: false; reason: 'conflict'; conflict: Booking };

/** Liefert den ersten Eintrag, der sich mit dem Zeitraum überschneidet. */
export function findConflict(
	db: AppDb,
	startsAt: number,
	endsAt: number,
	excludeId?: number
): Booking | undefined {
	const conditions: SQL[] = [lt(bookings.startsAt, endsAt), gt(bookings.endsAt, startsAt)];
	if (excludeId !== undefined) {
		conditions.push(ne(bookings.id, excludeId));
	}
	return db
		.select()
		.from(bookings)
		.where(and(...conditions))
		.orderBy(asc(bookings.startsAt))
		.limit(1)
		.get();
}

export function createBooking(
	db: AppDb,
	input: BookingInput,
	nowMs: number = Date.now()
): CreateBookingResult {
	return db.transaction((tx) => {
		const conflict = findConflict(tx as AppDb, input.startsAt, input.endsAt);
		if (conflict) {
			return { ok: false as const, conflict };
		}
		const { token, hash } = generateEditToken();
		const booking = tx
			.insert(bookings)
			.values({ ...input, editTokenHash: hash, createdAt: nowMs })
			.returning()
			.get();
		return { ok: true as const, booking, editToken: token };
	});
}

export function getBookingById(db: AppDb, id: number): Booking | undefined {
	return db.select().from(bookings).where(eq(bookings.id, id)).get();
}

/** Alle Einträge, die den Zeitraum [fromMs, toMs) berühren, sortiert nach Start. */
export function listBookingsBetween(db: AppDb, fromMs: number, toMs: number): Booking[] {
	return db
		.select()
		.from(bookings)
		.where(and(lt(bookings.startsAt, toMs), gt(bookings.endsAt, fromMs)))
		.orderBy(asc(bookings.startsAt))
		.all();
}

export function updateBooking(
	db: AppDb,
	id: number,
	token: string,
	input: BookingInput,
	nowMs: number = Date.now()
): UpdateBookingResult {
	void nowMs;
	return db.transaction((tx) => {
		const existing = getBookingById(tx as AppDb, id);
		if (!existing || !verifyToken(token, existing.editTokenHash)) {
			return { ok: false as const, reason: 'invalid-token' as const };
		}
		const conflict = findConflict(tx as AppDb, input.startsAt, input.endsAt, id);
		if (conflict) {
			return { ok: false as const, reason: 'conflict' as const, conflict };
		}
		const booking = tx.update(bookings).set(input).where(eq(bookings.id, id)).returning().get();
		return { ok: true as const, booking };
	});
}

export function deleteBooking(db: AppDb, id: number, token: string): boolean {
	return db.transaction((tx) => {
		const existing = getBookingById(tx as AppDb, id);
		if (!existing || !verifyToken(token, existing.editTokenHash)) {
			return false;
		}
		tx.delete(bookings).where(eq(bookings.id, id)).run();
		return true;
	});
}

/** Löscht Einträge, deren Ende mehr als 30 Tage zurückliegt. Liefert die Anzahl. */
export function cleanupOldBookings(db: AppDb, nowMs: number = Date.now()): number {
	const result = db
		.delete(bookings)
		.where(lt(bookings.endsAt, nowMs - RETENTION_MS))
		.run();
	return result.changes;
}
