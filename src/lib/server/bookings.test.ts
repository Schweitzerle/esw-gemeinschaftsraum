import { beforeEach, describe, expect, test } from 'vitest';
import { berlinDateTimeToMs } from '$lib/time';
import { createDb, type AppDb } from './db/create-db';
import {
	cleanupOldBookings,
	createBooking,
	deleteBooking,
	getBookingById,
	listBookingsBetween,
	updateBooking,
	RETENTION_MS
} from './bookings';
import { hashToken } from './tokens';

const NOW = berlinDateTimeToMs('2026-07-17', '12:00');

function input(overrides: Partial<Parameters<typeof createBooking>[1]> = {}) {
	return {
		title: 'Spieleabend',
		description: null,
		name: 'Julia',
		room: '204',
		contact: '0151 12345678',
		isPublic: true,
		startsAt: berlinDateTimeToMs('2026-07-18', '19:00'),
		endsAt: berlinDateTimeToMs('2026-07-18', '23:00'),
		...overrides
	};
}

let db: AppDb;

beforeEach(() => {
	db = createDb(':memory:');
});

describe('createBooking', () => {
	test('legt Eintrag an und liefert Edit-Token', () => {
		const result = createBooking(db, input(), NOW);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.booking.id).toBeGreaterThan(0);
		expect(result.booking.title).toBe('Spieleabend');
		// Token ist nicht in der DB, nur der Hash
		expect(hashToken(result.editToken)).toBe(result.booking.editTokenHash);
	});

	test('verhindert Überlappung und nennt den störenden Eintrag', () => {
		createBooking(db, input(), NOW);
		const result = createBooking(
			db,
			input({
				title: 'Kochabend',
				startsAt: berlinDateTimeToMs('2026-07-18', '22:00'),
				endsAt: berlinDateTimeToMs('2026-07-18', '23:30')
			}),
			NOW
		);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.conflict.title).toBe('Spieleabend');
	});

	test('direkt angrenzende Einträge sind erlaubt', () => {
		createBooking(db, input(), NOW);
		const result = createBooking(
			db,
			input({
				startsAt: berlinDateTimeToMs('2026-07-18', '23:00'),
				endsAt: berlinDateTimeToMs('2026-07-19', '01:00')
			}),
			NOW
		);
		expect(result.ok).toBe(true);
	});
});

describe('listBookingsBetween', () => {
	test('liefert Einträge, die den Bereich berühren, sortiert nach Start', () => {
		createBooking(db, input(), NOW);
		createBooking(
			db,
			input({
				title: 'Frühstück',
				startsAt: berlinDateTimeToMs('2026-07-18', '09:00'),
				endsAt: berlinDateTimeToMs('2026-07-18', '11:00')
			}),
			NOW
		);
		createBooking(
			db,
			input({
				title: 'Nächste Woche',
				startsAt: berlinDateTimeToMs('2026-07-25', '09:00'),
				endsAt: berlinDateTimeToMs('2026-07-25', '11:00')
			}),
			NOW
		);
		const list = listBookingsBetween(
			db,
			berlinDateTimeToMs('2026-07-18', '00:00'),
			berlinDateTimeToMs('2026-07-19', '00:00')
		);
		expect(list.map((b) => b.title)).toEqual(['Frühstück', 'Spieleabend']);
	});
});

describe('updateBooking', () => {
	test('ändert mit gültigem Token', () => {
		const created = createBooking(db, input(), NOW);
		if (!created.ok) throw new Error('setup');
		const result = updateBooking(
			db,
			created.booking.id,
			created.editToken,
			{ ...input({ title: 'Filmabend' }) },
			NOW
		);
		expect(result.ok).toBe(true);
		expect(getBookingById(db, created.booking.id)?.title).toBe('Filmabend');
	});

	test('lehnt falsches Token ab', () => {
		const created = createBooking(db, input(), NOW);
		if (!created.ok) throw new Error('setup');
		const result = updateBooking(db, created.booking.id, 'falsches-token', input(), NOW);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('invalid-token');
	});

	test('Überlappungsprüfung ignoriert den eigenen Eintrag', () => {
		const created = createBooking(db, input(), NOW);
		if (!created.ok) throw new Error('setup');
		const result = updateBooking(
			db,
			created.booking.id,
			created.editToken,
			input({ endsAt: berlinDateTimeToMs('2026-07-18', '23:30') }),
			NOW
		);
		expect(result.ok).toBe(true);
	});

	test('erkennt Überlappung mit anderem Eintrag', () => {
		createBooking(
			db,
			input({
				title: 'Anderer',
				startsAt: berlinDateTimeToMs('2026-07-18', '15:00'),
				endsAt: berlinDateTimeToMs('2026-07-18', '17:00')
			}),
			NOW
		);
		const created = createBooking(db, input(), NOW);
		if (!created.ok) throw new Error('setup');
		const result = updateBooking(
			db,
			created.booking.id,
			created.editToken,
			input({
				startsAt: berlinDateTimeToMs('2026-07-18', '16:00'),
				endsAt: berlinDateTimeToMs('2026-07-18', '18:00')
			}),
			NOW
		);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('conflict');
	});
});

describe('deleteBooking', () => {
	test('löscht nur mit gültigem Token', () => {
		const created = createBooking(db, input(), NOW);
		if (!created.ok) throw new Error('setup');
		expect(deleteBooking(db, created.booking.id, 'falsch')).toBe(false);
		expect(getBookingById(db, created.booking.id)).toBeDefined();
		expect(deleteBooking(db, created.booking.id, created.editToken)).toBe(true);
		expect(getBookingById(db, created.booking.id)).toBeUndefined();
	});
});

describe('cleanupOldBookings', () => {
	test('löscht Einträge, deren Ende länger als 30 Tage her ist', () => {
		// Direkt einfügen, um die Vergangenheits-Validierung zu umgehen
		const old = input({
			title: 'Uralt',
			startsAt: NOW - RETENTION_MS - 4 * 60 * 60 * 1000,
			endsAt: NOW - RETENTION_MS - 60 * 60 * 1000
		});
		const recent = input({
			title: 'Kürzlich',
			startsAt: NOW - 2 * 24 * 60 * 60 * 1000,
			endsAt: NOW - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
		});
		for (const b of [old, recent]) {
			createBooking(db, b, b.startsAt - 1000);
		}
		const deleted = cleanupOldBookings(db, NOW);
		expect(deleted).toBe(1);
		const remaining = listBookingsBetween(db, 0, Number.MAX_SAFE_INTEGER);
		expect(remaining.map((b) => b.title)).toEqual(['Kürzlich']);
	});
});
