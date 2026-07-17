import { describe, expect, test } from 'vitest';
import {
	berlinDateTimeToMs,
	computeRange,
	formatDayLong,
	formatTime,
	todayInBerlin,
	weekDays
} from './time';

describe('berlinDateTimeToMs', () => {
	test('wandelt Sommerzeit-Datum korrekt um (UTC+2)', () => {
		// 17.07.2026 20:00 Berlin = 18:00 UTC
		expect(berlinDateTimeToMs('2026-07-17', '20:00')).toBe(Date.UTC(2026, 6, 17, 18, 0));
	});

	test('wandelt Winterzeit-Datum korrekt um (UTC+1)', () => {
		// 10.01.2026 20:00 Berlin = 19:00 UTC
		expect(berlinDateTimeToMs('2026-01-10', '20:00')).toBe(Date.UTC(2026, 0, 10, 19, 0));
	});
});

describe('computeRange', () => {
	test('normale Buchung am selben Tag', () => {
		const { startsAt, endsAt } = computeRange('2026-07-17', '18:00', '20:30');
		expect(endsAt - startsAt).toBe(2.5 * 60 * 60 * 1000);
	});

	test('Endzeit vor Startzeit bedeutet Ende am Folgetag', () => {
		const { startsAt, endsAt } = computeRange('2026-07-17', '22:00', '02:00');
		expect(endsAt - startsAt).toBe(4 * 60 * 60 * 1000);
	});

	test('Endzeit gleich Startzeit bedeutet Ende am Folgetag (24 h)', () => {
		const { startsAt, endsAt } = computeRange('2026-07-17', '20:00', '20:00');
		expect(endsAt - startsAt).toBe(24 * 60 * 60 * 1000);
	});
});

describe('Anzeige-Formatierung', () => {
	test('formatTime zeigt Berliner Uhrzeit', () => {
		const ms = Date.UTC(2026, 6, 17, 18, 0); // 20:00 Berlin
		expect(formatTime(ms)).toBe('20:00');
	});

	test('formatDayLong zeigt deutschen Wochentag und Datum', () => {
		const ms = berlinDateTimeToMs('2026-07-17', '12:00'); // Freitag
		expect(formatDayLong(ms)).toContain('Freitag');
		expect(formatDayLong(ms)).toContain('17.');
	});
});

describe('Wochen-Helfer', () => {
	test('weekDays liefert 7 Tage ab Montag', () => {
		const days = weekDays('2026-07-17'); // Freitag
		expect(days).toHaveLength(7);
		expect(days[0].date).toBe('2026-07-13'); // Montag
		expect(days[6].date).toBe('2026-07-19'); // Sonntag
	});

	test('todayInBerlin liefert ISO-Datum', () => {
		expect(todayInBerlin()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});
