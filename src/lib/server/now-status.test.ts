import { describe, expect, test } from 'vitest';
import { berlinDateTimeToMs } from '$lib/time';
import type { Booking } from './db/schema';
import { getNowStatus } from './now-status';

function booking(overrides: Partial<Booking>): Booking {
	return {
		id: 1,
		title: 'Spieleabend',
		description: null,
		name: 'Julia',
		openEnd: false,
		contact: 'x',
		isPublic: true,
		startsAt: 0,
		endsAt: 0,
		editTokenHash: '',
		createdAt: 0,
		...overrides
	};
}

const NOW = berlinDateTimeToMs('2026-07-17', '20:00');

describe('getNowStatus', () => {
	test('erkennt laufende Belegung', () => {
		const current = booking({
			startsAt: berlinDateTimeToMs('2026-07-17', '19:00'),
			endsAt: berlinDateTimeToMs('2026-07-17', '23:00')
		});
		const status = getNowStatus([current], NOW);
		expect(status.current?.title).toBe('Spieleabend');
		expect(status.next).toBeUndefined();
	});

	test('frei mit nächster Belegung heute', () => {
		const later = booking({
			startsAt: berlinDateTimeToMs('2026-07-17', '21:30'),
			endsAt: berlinDateTimeToMs('2026-07-17', '23:00')
		});
		const status = getNowStatus([later], NOW);
		expect(status.current).toBeUndefined();
		expect(status.next?.startsAt).toBe(later.startsAt);
	});

	test('frei ohne weitere Belegung', () => {
		const past = booking({
			startsAt: berlinDateTimeToMs('2026-07-17', '10:00'),
			endsAt: berlinDateTimeToMs('2026-07-17', '12:00')
		});
		const status = getNowStatus([past], NOW);
		expect(status.current).toBeUndefined();
		expect(status.next).toBeUndefined();
	});

	test('bei laufender Belegung wird auch die nächste gemeldet', () => {
		const current = booking({
			startsAt: berlinDateTimeToMs('2026-07-17', '19:00'),
			endsAt: berlinDateTimeToMs('2026-07-17', '21:00')
		});
		const next = booking({
			id: 2,
			title: 'Danach',
			startsAt: berlinDateTimeToMs('2026-07-17', '21:00'),
			endsAt: berlinDateTimeToMs('2026-07-17', '22:00')
		});
		const status = getNowStatus([current, next], NOW);
		expect(status.current?.id).toBe(1);
		expect(status.next?.id).toBe(2);
	});
});
