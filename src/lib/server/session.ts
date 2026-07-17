import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/** Session-Gültigkeit: 180 Tage */
export const SESSION_TTL_MS = 180 * 24 * 60 * 60 * 1000;
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
 * Vergleicht das eingegebene Passwort mit dem Haus-Passwort in konstanter
 * Zeit (über SHA-256-Digests, damit unterschiedliche Längen kein Timing leaken).
 */
export function verifyPassword(input: string, expected: string): boolean {
	if (!input || !expected) return false;
	const a = createHash('sha256').update(input).digest();
	const b = createHash('sha256').update(expected).digest();
	return timingSafeEqual(a, b);
}
