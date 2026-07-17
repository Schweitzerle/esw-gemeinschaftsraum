import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Erzeugt ein geheimes Bearbeitungs-Token (32 Byte, base64url) und dessen
 * SHA-256-Hash. Nur der Hash wird in der Datenbank gespeichert.
 */
export function generateEditToken(): { token: string; hash: string } {
	const token = randomBytes(32).toString('base64url');
	return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

/** Vergleicht Token gegen gespeicherten Hash in konstanter Zeit. */
export function verifyToken(token: string, storedHash: string): boolean {
	if (!token || !storedHash) return false;
	const actual = Buffer.from(hashToken(token), 'hex');
	const expected = Buffer.from(storedHash, 'hex');
	return actual.length === expected.length && timingSafeEqual(actual, expected);
}
