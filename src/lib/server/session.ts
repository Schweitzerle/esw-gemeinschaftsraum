import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

/** Session-Gültigkeit: 180 Tage */
export const SESSION_TTL_MS = 180 * 24 * 60 * 60 * 1000;
/**
 * Ab diesem Alter wird die Session bei jedem Request stillschweigend verlängert.
 * Wer die Seite öfter als alle 180 Tage benutzt, muss das Passwort damit nie
 * wieder eingeben; ungenutzte Geräte laufen nach 180 Tagen trotzdem ab.
 */
export const SESSION_RENEW_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = 'gr_session';

function sign(secret: string, payload: string): string {
	return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Erzeugt den signierten Cookie-Wert: `<ablauf-ms>.<signatur>` */
export function createSessionValue(secret: string, expiresAtMs: number): string {
	const payload = String(expiresAtMs);
	return `${payload}.${sign(secret, payload)}`;
}

/** Prüft Signatur und Ablauf eines Cookie-Werts in konstanter Zeit. */
export function verifySessionValue(
	secret: string,
	value: string,
	nowMs: number = Date.now()
): boolean {
	const parts = value.split('.');
	if (parts.length !== 2) return false;
	const [payload, signature] = parts;
	const expiresAtMs = Number(payload);
	if (!Number.isFinite(expiresAtMs)) return false;

	const expected = Buffer.from(sign(secret, payload));
	const actual = Buffer.from(signature);
	if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
		return false;
	}
	return nowMs <= expiresAtMs;
}

/**
 * Setzt das Session-Cookie mit voller Laufzeit. Eine Stelle für Login und
 * Verlängerung, damit die Cookie-Optionen nicht auseinanderlaufen.
 * `secure` überlässt SvelteKit dem Kontext: aus auf http://localhost, sonst an.
 */
export function issueSessionCookie(cookies: Cookies, secret: string, nowMs: number = Date.now()) {
	cookies.set(SESSION_COOKIE, createSessionValue(secret, nowMs + SESSION_TTL_MS), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: SESSION_TTL_MS / 1000
	});
}

/**
 * Soll das Cookie erneuert werden? Nur für gültige Sessions, die älter als
 * `SESSION_RENEW_AFTER_MS` sind — dadurch bleibt die Schreiblast bei einem
 * Cookie pro Gerät und Monat statt bei einem pro Request.
 */
export function shouldRenewSession(
	secret: string,
	value: string,
	nowMs: number = Date.now()
): boolean {
	if (!verifySessionValue(secret, value, nowMs)) return false;
	const expiresAtMs = Number(value.split('.')[0]);
	const ageMs = SESSION_TTL_MS - (expiresAtMs - nowMs);
	return ageMs > SESSION_RENEW_AFTER_MS;
}

/**
 * Vergleicht das eingegebene Passwort mit dem Haus-Passwort in konstanter
 * Zeit (über SHA-256-Digests, damit unterschiedliche Längen kein Timing leaken).
 */
export function verifyPassword(input: string, expected: string): boolean {
	if (!input || !expected) return false;
	const a = createHash('sha256').update(input).digest();
	const b = createHash('sha256').update(expected).digest();
	return timingSafeEqual(a, b);
}
