import { describe, expect, test } from 'vitest';
import {
	SESSION_RENEW_AFTER_MS,
	SESSION_TTL_MS,
	createSessionValue,
	shouldRenewSession,
	verifyPassword,
	verifySessionValue
} from './session';

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';

describe('Session-Cookie', () => {
	test('gültige Session wird akzeptiert', () => {
		const value = createSessionValue(SECRET, 1_000_000);
		expect(verifySessionValue(SECRET, value, 999_999)).toBe(true);
	});

	test('abgelaufene Session wird abgelehnt', () => {
		const value = createSessionValue(SECRET, 1_000_000);
		expect(verifySessionValue(SECRET, value, 1_000_001)).toBe(false);
	});

	test('manipulierte Ablaufzeit wird abgelehnt', () => {
		const value = createSessionValue(SECRET, 1_000_000);
		const [, signature] = value.split('.');
		expect(verifySessionValue(SECRET, `9000000000000.${signature}`, 0)).toBe(false);
	});

	test('falsches Secret wird abgelehnt', () => {
		const value = createSessionValue(SECRET, 1_000_000);
		expect(verifySessionValue('anderes-secret-0123456789abcdef012345678', value, 0)).toBe(false);
	});

	test('kaputte Werte werden abgelehnt', () => {
		expect(verifySessionValue(SECRET, '', 0)).toBe(false);
		expect(verifySessionValue(SECRET, 'nur-ein-teil', 0)).toBe(false);
		expect(verifySessionValue(SECRET, 'abc.def.ghi', 0)).toBe(false);
		expect(verifySessionValue(SECRET, 'NaN.abcdef', 0)).toBe(false);
	});
});

describe('shouldRenewSession', () => {
	const issuedAt = 1_000_000_000_000;
	const value = createSessionValue(SECRET, issuedAt + SESSION_TTL_MS);

	test('frische Session wird nicht erneuert', () => {
		expect(shouldRenewSession(SECRET, value, issuedAt + 1000)).toBe(false);
	});

	test('Session wird erneuert, sobald sie älter als das Erneuerungsfenster ist', () => {
		const kurzDavor = issuedAt + SESSION_RENEW_AFTER_MS - 1000;
		const kurzDanach = issuedAt + SESSION_RENEW_AFTER_MS + 1000;
		expect(shouldRenewSession(SECRET, value, kurzDavor)).toBe(false);
		expect(shouldRenewSession(SECRET, value, kurzDanach)).toBe(true);
	});

	test('abgelaufene oder manipulierte Sessions werden nicht erneuert', () => {
		expect(shouldRenewSession(SECRET, value, issuedAt + SESSION_TTL_MS + 1)).toBe(false);
		expect(shouldRenewSession(SECRET, 'kaputt', issuedAt)).toBe(false);
		expect(shouldRenewSession('anderes-secret-0123456789abcdef012345678', value, issuedAt)).toBe(
			false
		);
	});
});

describe('verifyPassword', () => {
	test('vergleicht Passwörter korrekt', () => {
		expect(verifyPassword('geheim', 'geheim')).toBe(true);
		expect(verifyPassword('falsch', 'geheim')).toBe(false);
		expect(verifyPassword('', 'geheim')).toBe(false);
		// unterschiedliche Längen dürfen nicht crashen
		expect(verifyPassword('x'.repeat(500), 'geheim')).toBe(false);
	});
});
