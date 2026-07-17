import { describe, expect, test } from 'vitest';
import { berlinDateTimeToMs } from '$lib/time';
import type { Booking } from './db/schema';
import { buildIcsFeed, getIcsToken, verifyIcsToken } from './ics';

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';

function booking(overrides: Partial<Booking>): Booking {
	return {
		id: 7,
		title: 'Spieleabend',
		description: null,
		name: 'Julia',
		room: '204',
		contact: 'geheim',
		isPublic: true,
		startsAt: berlinDateTimeToMs('2026-07-18', '19:00'),
		endsAt: berlinDateTimeToMs('2026-07-18', '23:00'),
		editTokenHash: '',
		createdAt: 0,
		...overrides
	};
}

describe('ICS-Token', () => {
	test('ist deterministisch und URL-sicher', () => {
		const token = getIcsToken(SECRET);
		expect(token).toBe(getIcsToken(SECRET));
		expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
	});

	test('verifyIcsToken akzeptiert nur das richtige Token', () => {
		expect(verifyIcsToken(getIcsToken(SECRET), SECRET)).toBe(true);
		expect(verifyIcsToken('falsch', SECRET)).toBe(false);
		expect(verifyIcsToken('', SECRET)).toBe(false);
	});
});

describe('buildIcsFeed', () => {
	test('enthält Termin mit UTC-Zeiten und Titel', () => {
		const ics = buildIcsFeed([booking({})]);
		expect(ics).toContain('BEGIN:VCALENDAR');
		expect(ics).toContain('BEGIN:VEVENT');
		expect(ics).toContain('SUMMARY:Spieleabend (öffentlich)');
		// 19:00 Berlin Sommerzeit = 17:00 UTC
		expect(ics).toContain('DTSTART:20260718T170000Z');
		expect(ics).toContain('DTEND:20260718T210000Z');
		expect(ics).toContain('UID:booking-7@gemeinschaftsraum');
		expect(ics).toContain('END:VCALENDAR');
	});

	test('enthält keine Kontaktdaten', () => {
		const ics = buildIcsFeed([booking({})]);
		expect(ics).not.toContain('geheim');
		expect(ics).not.toContain('204');
	});

	test('escapet Sonderzeichen', () => {
		const ics = buildIcsFeed([booking({ title: 'Party; mit, Komma\nund Zeile', isPublic: false })]);
		expect(ics).toContain('SUMMARY:Party\\; mit\\, Komma\\nund Zeile (privat)');
	});
});
