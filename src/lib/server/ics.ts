import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Booking } from './db/schema';

/**
 * Deterministisches Token für die Kalender-Abo-URL, abgeleitet vom
 * SESSION_SECRET. Kalender-Apps können keine Cookies senden, deshalb
 * schützt dieses Token den Feed.
 */
export function getIcsToken(sessionSecret: string): string {
	return createHmac('sha256', sessionSecret).update('ics-feed').digest('base64url').slice(0, 32);
}

export function verifyIcsToken(token: string, sessionSecret: string): boolean {
	const expected = Buffer.from(getIcsToken(sessionSecret));
	const actual = Buffer.from(token);
	return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function toIcsUtc(ms: number): string {
	return new Date(ms)
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\r?\n/g, '\\n');
}

/**
 * Baut einen ICS-Feed aus den Einträgen. Bewusst datensparsam:
 * nur Titel, Sichtbarkeit und Zeitraum — keine Namen oder Kontaktdaten.
 */
export function buildIcsFeed(bookings: Booking[]): string {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Gemeinschaftsraum//DE',
		'CALSCALE:GREGORIAN',
		'X-WR-CALNAME:Gemeinschaftsraum'
	];
	for (const b of bookings) {
		lines.push(
			'BEGIN:VEVENT',
			`UID:booking-${b.id}@gemeinschaftsraum`,
			`DTSTAMP:${toIcsUtc(b.createdAt)}`,
			`DTSTART:${toIcsUtc(b.startsAt)}`,
			`DTEND:${toIcsUtc(b.endsAt)}`,
			`SUMMARY:${escapeIcsText(b.title)} (${b.isPublic ? 'öffentlich' : 'privat'})`,
			'END:VEVENT'
		);
	}
	lines.push('END:VCALENDAR');
	return lines.join('\r\n') + '\r\n';
}
